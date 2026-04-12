package services

import (
	"fmt"
	"regexp"
	"strings"
)

// RegexMatchResult 正则匹配结果
type RegexMatchResult struct {
	FullMatch   string            `json:"fullMatch"`
	Index       int               `json:"index"`
	Length      int               `json:"length"`
	Groups      []string          `json:"groups"`
	NamedGroups map[string]string `json:"namedGroups"`
}

// RegexValidateResult 正则验证结果
type RegexValidateResult struct {
	Valid bool   `json:"valid"`
	Error string `json:"error"`
	Pos   int    `json:"pos"`
	Hint  string `json:"hint"`
}

// CodeGenerateResult 代码生成结果
type CodeGenerateResult struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

// RegexService 正则表达式服务
type RegexService struct{}

// NewRegexService 创建正则服务
func NewRegexService() *RegexService {
	return &RegexService{}
}

// ValidateRegex 验证正则表达式
func (s *RegexService) ValidateRegex(pattern string, flags string) *RegexValidateResult {
	result := &RegexValidateResult{Valid: true}
	if pattern == "" {
		return result
	}
	goFlags := jsFlagsToGo(flags)
	_, err := regexp.Compile(goFlags + pattern)
	if err != nil {
		result.Valid = false
		errStr := err.Error()
		result.Error = errStr
		if idx := strings.Index(errStr, ":"); idx != -1 {
			result.Hint = strings.TrimSpace(errStr[idx+1:])
		} else {
			result.Hint = errStr
		}
	}
	return result
}

// ExecuteRegex 执行正则匹配
func (s *RegexService) ExecuteRegex(pattern string, text string, flags string) ([]RegexMatchResult, error) {
	if pattern == "" || text == "" {
		return []RegexMatchResult{}, nil
	}

	goFlags := jsFlagsToGo(flags)
	re, err := regexp.Compile(goFlags + pattern)
	if err != nil {
		return nil, fmt.Errorf("正则表达式语法错误: %s", err.Error())
	}

	matches := re.FindAllStringSubmatchIndex(text, -1)
	if matches == nil {
		return []RegexMatchResult{}, nil
	}

	results := make([]RegexMatchResult, 0, len(matches))
	for _, loc := range matches {
		fullMatch := text[loc[0]:loc[1]]
		groups := make([]string, 0)
		namedGroups := make(map[string]string)

		for i := 2; i < len(loc); i += 2 {
			if loc[i] != -1 {
				groups = append(groups, text[loc[i]:loc[i+1]])
			} else {
				groups = append(groups, "")
			}
		}

		for _, name := range re.SubexpNames()[1:] {
			if name != "" {
				idx := 0
				for ni, n := range re.SubexpNames() {
					if n == name {
						idx = ni
						break
					}
				}
				if idx > 0 && idx*2 < len(loc) && loc[idx*2] != -1 {
					namedGroups[name] = text[loc[idx*2]:loc[idx*2+1]]
				}
			}
		}

		results = append(results, RegexMatchResult{
			FullMatch:   fullMatch,
			Index:       loc[0],
			Length:      loc[1] - loc[0],
			Groups:      groups,
			NamedGroups: namedGroups,
		})
	}

	return results, nil
}

// ReplaceRegex 执行正则替换
func (s *RegexService) ReplaceRegex(pattern string, text string, replacement string, flags string) (string, error) {
	if pattern == "" || text == "" {
		return text, nil
	}

	goFlags := jsFlagsToGo(flags)
	re, err := regexp.Compile(goFlags + pattern)
	if err != nil {
		return "", fmt.Errorf("正则表达式语法错误: %s", err.Error())
	}

	return re.ReplaceAllString(text, replacement), nil
}

// GenerateCode 生成指定语言的代码
func (s *RegexService) GenerateCode(pattern string, flags string, language string) (*CodeGenerateResult, error) {
	if pattern == "" {
		return nil, fmt.Errorf("pattern is empty")
	}

	var code string
	switch strings.ToLower(language) {
	case "go":
		code = generateGoCode(pattern, flags)
	case "java":
		code = generateJavaCode(pattern, flags)
	case "python":
		code = generatePythonCode(pattern, flags)
	case "javascript":
		code = generateJavaScriptCode(pattern, flags)
	case "php":
		code = generatePHPCode(pattern, flags)
	case "csharp":
		code = generateCSharpCode(pattern, flags)
	case "rust":
		code = generateRustCode(pattern, flags)
	case "dart":
		code = generateDartCode(pattern, flags)
	case "ruby":
		code = generateRubyCode(pattern, flags)
	case "kotlin":
		code = generateKotlinCode(pattern, flags)
	default:
		return nil, fmt.Errorf("unsupported language: %s", language)
	}

	return &CodeGenerateResult{Language: language, Code: code}, nil
}

// GenerateAllCodes 生成所有语言的代码
func (s *RegexService) GenerateAllCodes(pattern string, flags string) (map[string]string, error) {
	if pattern == "" {
		return nil, fmt.Errorf("pattern is empty")
	}

	languages := []string{"go", "java", "python", "javascript", "php", "csharp", "rust", "dart", "ruby", "kotlin"}
	result := make(map[string]string)
	for _, lang := range languages {
		codeResult, err := s.GenerateCode(pattern, flags, lang)
		if err != nil {
			continue
		}
		result[lang] = codeResult.Code
	}
	return result, nil
}

func jsFlagsToGo(flags string) string {
	suffix := ""
	if strings.Contains(flags, "i") {
		suffix += "(?i)"
	}
	if strings.Contains(flags, "m") {
		suffix += "(?m)"
	}
	if strings.Contains(flags, "s") {
		suffix += "(?s)"
	}
	return suffix
}

func generateGoCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += "i"
	}
	if strings.Contains(flags, "m") {
		flagStr += "m"
	}
	if strings.Contains(flags, "s") {
		flagStr += "s"
	}
	p := pattern
	if flagStr != "" {
		p = "(?" + flagStr + ")" + pattern
	}
	return fmt.Sprintf(`package main

import (
	"fmt"
	"regexp"
)

func main() {
	re := regexp.MustCompile(%s)
	text := "your text here"
	matches := re.FindAllString(text, -1)
	for _, m := range matches {
		fmt.Println(m)
	}
}`, "`"+p+"`")
}

func generateJavaCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += ", Pattern.CASE_INSENSITIVE"
	}
	if strings.Contains(flags, "m") {
		flagStr += ", Pattern.MULTILINE"
	}
	if strings.Contains(flags, "s") {
		flagStr += ", Pattern.DOTALL"
	}
	if flagStr != "" {
		flagStr = flagStr[2:]
		return fmt.Sprintf(`import java.util.regex.*;

public class Main {
    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("%s", %s);
        Matcher matcher = pattern.matcher("your text here");
        while (matcher.find()) {
            System.out.println(matcher.group());
        }
    }
}`, pattern, flagStr)
	}
	return fmt.Sprintf(`import java.util.regex.*;

public class Main {
    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("%s");
        Matcher matcher = pattern.matcher("your text here");
        while (matcher.find()) {
            System.out.println(matcher.group());
        }
    }
}`, pattern)
}

func generatePythonCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += " | re.IGNORECASE"
	}
	if strings.Contains(flags, "m") {
		flagStr += " | re.MULTILINE"
	}
	if strings.Contains(flags, "s") {
		flagStr += " | re.DOTALL"
	}
	if flagStr != "" {
		flagStr = flagStr[3:]
		return fmt.Sprintf(`import re

pattern = r"%s"
text = "your text here"
matches = re.findall(pattern, text%s)
for match in matches:
    print(match)`, pattern, flagStr)
	}
	return fmt.Sprintf(`import re

pattern = r"%s"
text = "your text here"
matches = re.findall(pattern, text)
for match in matches:
    print(match)`, pattern)
}

func generateJavaScriptCode(pattern, flags string) string {
	jsFlags := ""
	if strings.Contains(flags, "g") {
		jsFlags += "g"
	}
	if strings.Contains(flags, "i") {
		jsFlags += "i"
	}
	if strings.Contains(flags, "m") {
		jsFlags += "m"
	}
	if strings.Contains(flags, "s") {
		jsFlags += "s"
	}
	return fmt.Sprintf(`const regex = /%s/%s;
const text = "your text here";
const matches = text.match(regex);
if (matches) {
    matches.forEach(match => console.log(match));
}`, pattern, jsFlags)
}

func generatePHPCode(pattern, flags string) string {
	phpFlags := ""
	if strings.Contains(flags, "i") {
		phpFlags += "i"
	}
	if strings.Contains(flags, "m") {
		phpFlags += "m"
	}
	if strings.Contains(flags, "s") {
		phpFlags += "s"
	}
	return fmt.Sprintf(`<?php
$pattern = '/%s/%s';
$text = 'your text here';
preg_match_all($pattern, $text, $matches);
print_r($matches[0]);`, pattern, phpFlags)
}

func generateCSharpCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += " | RegexOptions.IgnoreCase"
	}
	if strings.Contains(flags, "m") {
		flagStr += " | RegexOptions.Multiline"
	}
	if strings.Contains(flags, "s") {
		flagStr += " | RegexOptions.Singleline"
	}
	if flagStr != "" {
		flagStr = flagStr[3:]
		return fmt.Sprintf(`using System;
using System.Text.RegularExpressions;

class Program {
    static void Main() {
        var regex = new Regex(@"%s", %s);
        var text = "your text here";
        foreach (Match match in regex.Matches(text)) {
            Console.WriteLine(match.Value);
        }
    }
}`, pattern, flagStr)
	}
	return fmt.Sprintf(`using System;
using System.Text.RegularExpressions;

class Program {
    static void Main() {
        var regex = new Regex(@"%s");
        var text = "your text here";
        foreach (Match match in regex.Matches(text)) {
            Console.WriteLine(match.Value);
        }
    }
}`, pattern)
}

func generateRustCode(pattern, flags string) string {
	return fmt.Sprintf(`use regex::Regex;

fn main() {
    let re = Regex::new(r"%s").unwrap();
    let text = "your text here";
    for cap in re.captures_iter(text) {
        println!("{:?}", &cap[0]);
    }
}`, pattern)
}

func generateDartCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += ", caseSensitive: false"
	}
	if strings.Contains(flags, "m") {
		flagStr += ", multiLine: true"
	}
	if strings.Contains(flags, "s") {
		flagStr += ", dotAll: true"
	}
	return fmt.Sprintf(`void main() {
  final regex = RegExp(r"%s"%s);
  final text = 'your text here';
  final matches = regex.allMatches(text);
  for (final match in matches) {
    print(match.group(0));
  }
}`, pattern, flagStr)
}

func generateRubyCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += "i"
	}
	if strings.Contains(flags, "m") {
		flagStr += "m"
	}
	return fmt.Sprintf(`pattern = /%s/%s
text = "your text here"
matches = text.scan(pattern)
matches.each do |match|
  puts match
end`, pattern, flagStr)
}

func generateKotlinCode(pattern, flags string) string {
	flagStr := ""
	if strings.Contains(flags, "i") {
		flagStr += ", setOf(RegexOption.IGNORE_CASE)"
	}
	if strings.Contains(flags, "m") {
		if flagStr == "" {
			flagStr += ", setOf(RegexOption.MULTILINE)"
		}
	}
	if strings.Contains(flags, "s") {
		if flagStr == "" {
			flagStr += ", setOf(RegexOption.DOT_MATCHES_ALL)"
		}
	}
	return fmt.Sprintf(`fun main() {
    val regex = Regex("%s"%s)
    val text = "your text here"
    val matches = regex.findAll(text)
    matches.forEach { match ->
        println(match.value)
    }
}`, pattern, flagStr)
}
