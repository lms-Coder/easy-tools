package services

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// CronParseResult cron 解析结果
type CronParseResult struct {
	Valid  bool            `json:"valid"`
	Error  string          `json:"error"`
	Fields []CronFieldDesc `json:"fields"`
	Human  string          `json:"human"`
}

// CronFieldDesc 单个字段描述
type CronFieldDesc struct {
	Name  string `json:"name"`
	Value string `json:"value"`
	Desc  string `json:"desc"`
}

// CronService cron 表达式服务
type CronService struct{}

// NewCronService 创建 cron 服务
func NewCronService() *CronService {
	return &CronService{}
}

// 标准字段定义
var cronFields = []struct {
	name     string
	min, max int
}{
	{"秒", 0, 59},
	{"分", 0, 59},
	{"时", 0, 23},
	{"日", 1, 31},
	{"月", 1, 12},
	{"周", 0, 6},
}

var weekNames = []string{"日", "一", "二", "三", "四", "五", "六"}
var monthNames = []string{"", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"}

// ParseCron 解析 cron 表达式
func (s *CronService) ParseCron(expr string) (*CronParseResult, error) {
	if expr == "" {
		return &CronParseResult{Valid: true}, nil
	}

	parts := strings.Fields(expr)
	if len(parts) != 5 && len(parts) != 6 {
		return &CronParseResult{
			Valid: false,
			Error: fmt.Sprintf("表达式应有 5 或 6 个字段，当前有 %d 个", len(parts)),
		}, nil
	}

	// 如果是 5 段式，前面补 "0"（秒默认为 0）
	if len(parts) == 5 {
		parts = append([]string{"0"}, parts...)
	}

	result := &CronParseResult{Valid: true}
	for i, field := range parts {
		if i >= len(cronFields) {
			break
		}
		desc, err := describeField(field, cronFields[i].name, cronFields[i].min, cronFields[i].max)
		if err != "" {
			result.Valid = false
			result.Error = err
			return result, nil
		}
		result.Fields = append(result.Fields, CronFieldDesc{
			Name:  cronFields[i].name,
			Value: field,
			Desc:  desc,
		})
	}

	// 生成人类可读描述
	result.Human = buildHumanDesc(result.Fields)

	return result, nil
}

// NextRuns 计算接下来 N 次执行时间
func (s *CronService) NextRuns(expr string, count int) ([]string, error) {
	if expr == "" {
		return []string{}, nil
	}

	parts := strings.Fields(expr)
	if len(parts) != 5 && len(parts) != 6 {
		return nil, fmt.Errorf("表达式应有 5 或 6 个字段")
	}

	// 5 段式补秒
	if len(parts) == 5 {
		parts = append([]string{"0"}, parts...)
	}

	// 解析每个字段为值集合
	sets := make([]map[int]bool, 6)
	for i, field := range parts {
		if i >= 6 {
			break
		}
		set, err := parseFieldValues(field, cronFields[i].min, cronFields[i].max)
		if err != nil {
			return nil, fmt.Errorf("字段 %s(%s) 无效: %s", cronFields[i].name, field, err.Error())
		}
		sets[i] = set
	}

	now := time.Now()
	// 从下一秒开始搜索
	t := now.Truncate(time.Second).Add(time.Second)

	results := make([]string, 0, count)
	maxIter := 366 * 24 * 60 * 60 // 最多搜索一年

	for iter := 0; iter < maxIter && len(results) < count; iter++ {
		sec := t.Second()
		min := t.Minute()
		hour := t.Hour()
		day := t.Day()
		month := int(t.Month())
		wday := int(t.Weekday())

		if sets[0][sec] && sets[1][min] && sets[2][hour] && sets[3][day] && sets[4][month] && sets[5][wday] {
			results = append(results, t.Format("2006-01-02 15:04:05 周一"))
			// 跳到下一秒继续
			t = t.Add(time.Second)
		} else {
			// 智能跳转
			if !sets[4][month] {
				// 跳到下一个匹配的月份
				t = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
				t = t.AddDate(0, 1, 0)
				continue
			}
			if !sets[2][hour] {
				t = time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), 0, 0, 0, t.Location())
				t = t.Add(time.Hour)
				continue
			}
			if !sets[1][min] {
				t = t.Add(time.Minute)
				t = time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), 0, 0, t.Location())
				continue
			}
			t = t.Add(time.Second)
		}
	}

	return results, nil
}

// describeField 生成单个字段的中文描述
func describeField(field, name string, minVal, maxVal int) (string, string) {
	if field == "*" {
		return fmt.Sprintf("每%s", name), ""
	}
	if strings.HasPrefix(field, "*/") {
		stepStr := field[2:]
		step, err := strconv.Atoi(stepStr)
		if err != nil || step <= 0 {
			return "", fmt.Sprintf("字段 %s(%s) 格式错误", name, field)
		}
		return fmt.Sprintf("每隔 %d %s", step, name), ""
	}
	if strings.Contains(field, ",") {
		parts := strings.Split(field, ",")
		descs := make([]string, 0)
		for _, p := range parts {
			if d, e := describeSingle(p, name, minVal, maxVal); e != "" {
				return "", e
			} else {
				descs = append(descs, d)
			}
		}
		return strings.Join(descs, "、"), ""
	}
	if strings.Contains(field, "-") {
		return describeRange(field, name, minVal, maxVal)
	}
	return describeSingle(field, name, minVal, maxVal)
}

func describeSingle(field, name string, minVal, maxVal int) (string, string) {
	val, err := strconv.Atoi(field)
	if err != nil {
		return "", fmt.Sprintf("字段 %s(%s) 不是有效数字", name, field)
	}
	if val < minVal || val > maxVal {
		return "", fmt.Sprintf("字段 %s 值 %d 超出范围 [%d, %d]", name, val, minVal, maxVal)
	}
	if name == "周" && val >= 0 && val <= 6 {
		return fmt.Sprintf("周%s", weekNames[val]), ""
	}
	if name == "月" && val >= 1 && val <= 12 {
		return monthNames[val], ""
	}
	return fmt.Sprintf("第 %d %s", val, name), ""
}

func describeRange(field, name string, minVal, maxVal int) (string, string) {
	parts := strings.Split(field, "-")
	if len(parts) != 2 {
		return "", fmt.Sprintf("字段 %s(%s) 格式错误", name, field)
	}
	start, err1 := strconv.Atoi(parts[0])
	end, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil {
		return "", fmt.Sprintf("字段 %s(%s) 格式错误", name, field)
	}
	if start < minVal || end > maxVal || start > end {
		return "", fmt.Sprintf("字段 %s 范围 %d-%d 无效", name, start, end)
	}
	if name == "周" {
		return fmt.Sprintf("周%s 到 周%s", weekNames[start], weekNames[end]), ""
	}
	return fmt.Sprintf("%d 到 %d %s", start, end, name), ""
}

// buildHumanDesc 生成整体人类可读描述
func buildHumanDesc(fields []CronFieldDesc) string {
	if len(fields) == 0 {
		return ""
	}
	parts := make([]string, 0)
	for _, f := range fields {
		parts = append(parts, f.Desc)
	}
	return strings.Join(parts, "，")
}

// parseFieldValues 将字段解析为值集合
func parseFieldValues(field string, minVal, maxVal int) (map[int]bool, error) {
	result := make(map[int]bool)

	if field == "*" {
		for i := minVal; i <= maxVal; i++ {
			result[i] = true
		}
		return result, nil
	}

	if strings.HasPrefix(field, "*/") {
		step, err := strconv.Atoi(field[2:])
		if err != nil || step <= 0 {
			return nil, fmt.Errorf("invalid step: %s", field)
		}
		for i := minVal; i <= maxVal; i += step {
			result[i] = true
		}
		return result, nil
	}

	// 处理逗号分隔
	parts := strings.Split(field, ",")
	for _, part := range parts {
		if strings.Contains(part, "-") {
			rangeParts := strings.Split(part, "-")
			if len(rangeParts) != 2 {
				return nil, fmt.Errorf("invalid range: %s", part)
			}
			start, err1 := strconv.Atoi(rangeParts[0])
			end, err2 := strconv.Atoi(rangeParts[1])
			if err1 != nil || err2 != nil {
				return nil, fmt.Errorf("invalid range: %s", part)
			}
			for i := start; i <= end; i++ {
				if i >= minVal && i <= maxVal {
					result[i] = true
				}
			}
		} else {
			val, err := strconv.Atoi(part)
			if err != nil {
				return nil, fmt.Errorf("invalid value: %s", part)
			}
			if val >= minVal && val <= maxVal {
				result[val] = true
			}
		}
	}

	return result, nil
}
