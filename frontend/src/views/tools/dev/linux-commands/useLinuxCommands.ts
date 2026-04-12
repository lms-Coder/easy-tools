import { ref, computed, onMounted } from 'vue'
import { toast } from '@/composables/useToast'
import * as LinuxCmdService from '../../../../../bindings/easy-tools/internal/services/linuxcommandservice.js'

// ====== Types ======
interface CommandOption {
  flag: string
  desc: string
}

export interface LinuxCommand {
  name: string
  shortDesc: string
  category: string
  syntax: string
  description: string
  options: CommandOption[]
  examples: { cmd: string; desc: string }[]
  tags: string[]
}

interface CommandCategory {
  id: string
  name: string
}

// ====== Categories ======
const categories: CommandCategory[] = [
  { id: 'all', name: '全部' },
  { id: 'custom', name: '自定义' },
  { id: 'file', name: '文件管理' },
  { id: 'text', name: '文本处理' },
  { id: 'network', name: '网络工具' },
  { id: 'process', name: '进程管理' },
  { id: 'user', name: '用户权限' },
  { id: 'disk', name: '磁盘存储' },
  { id: 'compress', name: '压缩解压' },
  { id: 'system', name: '系统信息' },
  { id: 'package', name: '包管理' },
  { id: 'debug', name: '日志调试' },
  { id: 'shell', name: 'Shell 编程' },
  { id: 'perf', name: '性能监控' },
]

// ====== Commands Data ======
// @ts-ignore — large data block
const commands: LinuxCommand[] = [
  // === 文件管理 ===
  {
    name: 'ls',
    shortDesc: '列出目录内容',
    category: 'file',
    syntax: 'ls [选项] [文件]',
    description: 'ls 命令用于列出目录中的文件和子目录。默认显示当前目录，支持多种排序和过滤选项。',
    options: [
      { flag: '-l', desc: '长格式列出详细信息' },
      { flag: '-a', desc: '显示隐藏文件' },
      { flag: '-h', desc: '人类可读的文件大小' },
      { flag: '-R', desc: '递归列出子目录' },
    ],
    examples: [
      { cmd: 'ls -la', desc: '列出所有文件详细信息' },
      { cmd: 'ls -lh', desc: '人类可读格式显示大小' },
      { cmd: 'ls -R /home', desc: '递归列出 home 目录' },
    ],
    tags: ['list', 'directory', 'dir'],
  },
  {
    name: 'cd',
    shortDesc: '切换工作目录',
    category: 'file',
    syntax: 'cd [目录]',
    description: 'cd 命令用于切换当前工作目录。不带参数时回到用户主目录。',
    options: [
      { flag: '~', desc: '切换到用户主目录' },
      { flag: '-', desc: '切换到上一个目录' },
      { flag: '..', desc: '切换到上级目录' },
    ],
    examples: [
      { cmd: 'cd /var/log', desc: '切换到日志目录' },
      { cmd: 'cd -', desc: '返回上一个目录' },
      { cmd: 'cd ~', desc: '回到主目录' },
    ],
    tags: ['change', 'directory', 'navigate'],
  },
  {
    name: 'pwd',
    shortDesc: '显示当前目录',
    category: 'file',
    syntax: 'pwd [选项]',
    description: 'pwd 命令用于显示当前工作目录的绝对路径。',
    options: [
      { flag: '-L', desc: '显示逻辑路径（默认）' },
      { flag: '-P', desc: '显示物理路径（解析符号链接）' },
    ],
    examples: [
      { cmd: 'pwd', desc: '显示当前目录路径' },
      { cmd: 'pwd -P', desc: '显示解析符号链接后的路径' },
    ],
    tags: ['print', 'working', 'directory'],
  },
  {
    name: 'cp',
    shortDesc: '复制文件或目录',
    category: 'file',
    syntax: 'cp [选项] 源 目标',
    description: 'cp 命令用于复制文件或目录。支持递归复制整个目录。',
    options: [
      { flag: '-r', desc: '递归复制目录' },
      { flag: '-i', desc: '覆盖前确认' },
      { flag: '-p', desc: '保留文件属性' },
      { flag: '-v', desc: '显示复制过程' },
    ],
    examples: [
      { cmd: 'cp file.txt backup.txt', desc: '复制文件' },
      { cmd: 'cp -r dir1 dir2', desc: '递归复制目录' },
      { cmd: 'cp -iv a.txt b.txt', desc: '交互式复制并显示详情' },
    ],
    tags: ['copy', 'file', 'duplicate'],
  },
  {
    name: 'mv',
    shortDesc: '移动或重命名',
    category: 'file',
    syntax: 'mv [选项] 源 目标',
    description: 'mv 命令用于移动文件或重命名文件和目录。',
    options: [
      { flag: '-i', desc: '覆盖前确认' },
      { flag: '-f', desc: '强制覆盖不提示' },
      { flag: '-v', desc: '显示移动过程' },
    ],
    examples: [
      { cmd: 'mv old.txt new.txt', desc: '重命名文件' },
      { cmd: 'mv file.txt /tmp/', desc: '移动文件到 tmp 目录' },
      { cmd: 'mv -iv a.txt b.txt', desc: '交互式移动并显示详情' },
    ],
    tags: ['move', 'rename', 'file'],
  },
  {
    name: 'rm',
    shortDesc: '删除文件或目录',
    category: 'file',
    syntax: 'rm [选项] 文件',
    description: 'rm 命令用于删除文件或目录。删除后不可恢复，请谨慎使用。',
    options: [
      { flag: '-r', desc: '递归删除目录及内容' },
      { flag: '-f', desc: '强制删除不提示' },
      { flag: '-i', desc: '删除前逐个确认' },
      { flag: '-v', desc: '显示删除过程' },
    ],
    examples: [
      { cmd: 'rm file.txt', desc: '删除文件' },
      { cmd: 'rm -rf dir/', desc: '强制递归删除目录' },
      { cmd: 'rm -iv *.tmp', desc: '交互式删除临时文件' },
    ],
    tags: ['remove', 'delete', 'file'],
  },
  {
    name: 'mkdir',
    shortDesc: '创建目录',
    category: 'file',
    syntax: 'mkdir [选项] 目录',
    description: 'mkdir 命令用于创建新目录。可使用 -p 选项递归创建多级目录。',
    options: [
      { flag: '-p', desc: '递归创建多级目录' },
      { flag: '-m', desc: '设置目录权限' },
      { flag: '-v', desc: '显示创建过程' },
    ],
    examples: [
      { cmd: 'mkdir mydir', desc: '创建目录' },
      { cmd: 'mkdir -p a/b/c', desc: '递归创建多级目录' },
      { cmd: 'mkdir -m 755 dir', desc: '创建并设置权限' },
    ],
    tags: ['make', 'directory', 'create'],
  },
  {
    name: 'rmdir',
    shortDesc: '删除空目录',
    category: 'file',
    syntax: 'rmdir [选项] 目录',
    description: 'rmdir 命令用于删除空目录。目录中如有文件则无法删除。',
    options: [
      { flag: '-p', desc: '递归删除空目录' },
      { flag: '-v', desc: '显示删除过程' },
    ],
    examples: [
      { cmd: 'rmdir emptydir', desc: '删除空目录' },
      { cmd: 'rmdir -p a/b/c', desc: '递归删除空目录链' },
    ],
    tags: ['remove', 'directory', 'empty'],
  },
  {
    name: 'touch',
    shortDesc: '创建空文件',
    category: 'file',
    syntax: 'touch [选项] 文件',
    description: 'touch 命令用于创建空文件或更新文件的时间戳。',
    options: [
      { flag: '-a', desc: '仅修改访问时间' },
      { flag: '-m', desc: '仅修改修改时间' },
      { flag: '-c', desc: '文件不存在时不创建' },
    ],
    examples: [
      { cmd: 'touch newfile.txt', desc: '创建空文件' },
      { cmd: 'touch -c existing.txt', desc: '更新时间戳（不创建新文件）' },
      { cmd: 'touch file{1..5}.txt', desc: '批量创建多个文件' },
    ],
    tags: ['create', 'file', 'timestamp'],
  },
  {
    name: 'ln',
    shortDesc: '创建链接文件',
    category: 'file',
    syntax: 'ln [选项] 目标 链接名',
    description: 'ln 命令用于创建文件链接，包括硬链接和符号链接（软链接）。',
    options: [
      { flag: '-s', desc: '创建符号链接' },
      { flag: '-f', desc: '强制覆盖已有链接' },
      { flag: '-v', desc: '显示链接过程' },
    ],
    examples: [
      { cmd: 'ln -s /path/target link', desc: '创建符号链接' },
      { cmd: 'ln target hardlink', desc: '创建硬链接' },
      { cmd: 'ln -sf target link', desc: '强制更新符号链接' },
    ],
    tags: ['link', 'symlink', 'hardlink'],
  },
  {
    name: 'chmod',
    shortDesc: '修改文件权限',
    category: 'file',
    syntax: 'chmod [选项] 模式 文件',
    description: 'chmod 命令用于修改文件或目录的访问权限。支持数字和符号两种模式。',
    options: [
      { flag: '-R', desc: '递归修改目录权限' },
      { flag: '-v', desc: '显示权限变更详情' },
      { flag: '+x', desc: '添加可执行权限' },
    ],
    examples: [
      { cmd: 'chmod 755 script.sh', desc: '设置 rwxr-xr-x 权限' },
      { cmd: 'chmod -R 644 dir/', desc: '递归设置目录权限' },
      { cmd: 'chmod +x script.sh', desc: '添加可执行权限' },
    ],
    tags: ['permission', 'mode', 'access'],
  },
  {
    name: 'chown',
    shortDesc: '修改文件所有者',
    category: 'file',
    syntax: 'chown [选项] 用户:组 文件',
    description: 'chown 命令用于修改文件或目录的所有者和所属组。',
    options: [
      { flag: '-R', desc: '递归修改所有者' },
      { flag: '-v', desc: '显示变更详情' },
      { flag: '--reference', desc: '参照指定文件设置所有者' },
    ],
    examples: [
      { cmd: 'chown user:group file.txt', desc: '修改所有者和组' },
      { cmd: 'chown -R www-data:www-data /var/www', desc: '递归修改 Web 目录所有者' },
      { cmd: 'chown user file.txt', desc: '仅修改所有者' },
    ],
    tags: ['owner', 'group', 'permission'],
  },
  {
    name: 'chgrp',
    shortDesc: '修改文件所属组',
    category: 'file',
    syntax: 'chgrp [选项] 组 文件',
    description: 'chgrp 命令用于修改文件或目录的所属组。',
    options: [
      { flag: '-R', desc: '递归修改所属组' },
      { flag: '-v', desc: '显示变更详情' },
      { flag: '--reference', desc: '参照指定文件设置组' },
    ],
    examples: [
      { cmd: 'chgrp developers file.txt', desc: '修改文件所属组' },
      { cmd: 'chgrp -R staff /opt/project', desc: '递归修改目录所属组' },
    ],
    tags: ['group', 'permission', 'owner'],
  },
  {
    name: 'find',
    shortDesc: '查找文件或目录',
    category: 'file',
    syntax: 'find [路径] [表达式]',
    description: 'find 命令用于在指定目录树中按条件查找文件。支持按名称、类型、大小等多种条件过滤。',
    options: [
      { flag: '-name', desc: '按文件名匹配' },
      { flag: '-type', desc: '按文件类型查找' },
      { flag: '-size', desc: '按文件大小查找' },
      { flag: '-mtime', desc: '按修改时间查找' },
    ],
    examples: [
      { cmd: 'find . -name "*.log"', desc: '按名称查找日志文件' },
      { cmd: 'find / -type f -size +100M', desc: '查找大于 100M 的文件' },
      { cmd: 'find . -mtime -7 -name "*.txt"', desc: '查找 7 天内修改的 txt 文件' },
    ],
    tags: ['search', 'file', 'filter'],
  },
  {
    name: 'locate',
    shortDesc: '快速定位文件',
    category: 'file',
    syntax: 'locate [选项] 模式',
    description: 'locate 命令通过预建数据库快速查找文件路径，比 find 更快但不实时。',
    options: [
      { flag: '-i', desc: '忽略大小写' },
      { flag: '-c', desc: '只显示匹配数量' },
      { flag: '-r', desc: '使用正则表达式' },
    ],
    examples: [
      { cmd: 'locate nginx.conf', desc: '查找 nginx 配置文件' },
      { cmd: 'locate -i readme', desc: '忽略大小写查找 readme' },
      { cmd: 'locate -c ".jpg"', desc: '统计 jpg 文件数量' },
    ],
    tags: ['search', 'database', 'fast'],
  },
  {
    name: 'which',
    shortDesc: '查找命令路径',
    category: 'file',
    syntax: 'which [选项] 命令',
    description: 'which 命令用于查找可执行文件在 PATH 中的位置。',
    options: [
      { flag: '-a', desc: '显示所有匹配路径' },
    ],
    examples: [
      { cmd: 'which python3', desc: '查找 python3 路径' },
      { cmd: 'which -a node', desc: '查找所有 node 路径' },
    ],
    tags: ['command', 'path', 'executable'],
  },
  {
    name: 'whereis',
    shortDesc: '定位命令相关文件',
    category: 'file',
    syntax: 'whereis [选项] 命令',
    description: 'whereis 命令用于定位命令的二进制文件、源码和帮助页面的位置。',
    options: [
      { flag: '-b', desc: '只查找二进制文件' },
      { flag: '-m', desc: '只查找帮助文件' },
      { flag: '-s', desc: '只查找源码文件' },
    ],
    examples: [
      { cmd: 'whereis gcc', desc: '查找 gcc 相关文件' },
      { cmd: 'whereis -b python3', desc: '只查找二进制文件位置' },
    ],
    tags: ['command', 'binary', 'manual'],
  },
  {
    name: 'file',
    shortDesc: '检测文件类型',
    category: 'file',
    syntax: 'file [选项] 文件',
    description: 'file 命令用于检测文件类型，不依赖扩展名判断。',
    options: [
      { flag: '-b', desc: '不显示文件名' },
      { flag: '-i', desc: '显示 MIME 类型' },
      { flag: '-z', desc: '检测压缩文件内容' },
    ],
    examples: [
      { cmd: 'file data.bin', desc: '检测文件类型' },
      { cmd: 'file -i index.html', desc: '显示 MIME 类型' },
      { cmd: 'file -z archive.gz', desc: '检测压缩文件内容' },
    ],
    tags: ['type', 'detect', 'mime'],
  },
  {
    name: 'tree',
    shortDesc: '树形显示目录',
    category: 'file',
    syntax: 'tree [选项] [目录]',
    description: 'tree 命令以树形结构递归显示目录内容，直观展示层级关系。',
    options: [
      { flag: '-L', desc: '限制显示层级深度' },
      { flag: '-a', desc: '显示隐藏文件' },
      { flag: '-d', desc: '只显示目录' },
    ],
    examples: [
      { cmd: 'tree -L 2 /home', desc: '显示两层目录树' },
      { cmd: 'tree -d src/', desc: '只显示目录结构' },
      { cmd: 'tree -a --dirsfirst', desc: '显示隐藏文件并按目录排序' },
    ],
    tags: ['tree', 'directory', 'structure'],
  },
  {
    name: 'stat',
    shortDesc: '显示文件状态',
    category: 'file',
    syntax: 'stat [选项] 文件',
    description: 'stat 命令用于显示文件或文件系统的详细状态信息。',
    options: [
      { flag: '-c', desc: '自定义输出格式' },
      { flag: '-f', desc: '显示文件系统状态' },
      { flag: '-L', desc: '跟随符号链接' },
    ],
    examples: [
      { cmd: 'stat file.txt', desc: '显示文件详细状态' },
      { cmd: 'stat -f /home', desc: '显示文件系统信息' },
      { cmd: 'stat -c "%s %n" *', desc: '自定义格式输出大小和文件名' },
    ],
    tags: ['status', 'metadata', 'info'],
  },
  {
    name: 'rename',
    shortDesc: '批量重命名文件',
    category: 'file',
    syntax: 'rename [选项] 表达式 替换 文件',
    description: 'rename 命令用于批量重命名文件，支持 Perl 正则表达式。',
    options: [
      { flag: '-n', desc: '模拟运行不实际修改' },
      { flag: '-v', desc: '显示重命名详情' },
      { flag: '-f', desc: '强制覆盖已有文件' },
    ],
    examples: [
      { cmd: 'rename "s/.txt/.md/" *.txt', desc: '将 txt 扩展名改为 md' },
      { cmd: 'rename -n "s/old/new/" *.log', desc: '模拟批量重命名' },
      { cmd: 'rename "y/A-Z/a-z/" *', desc: '文件名转小写' },
    ],
    tags: ['rename', 'batch', 'regex'],
  },
  {
    name: 'basename',
    shortDesc: '提取文件名部分',
    category: 'file',
    syntax: 'basename [选项] 路径 [后缀]',
    description: 'basename 命令用于从路径中提取文件名部分，可去除指定后缀。',
    options: [
      { flag: '-a', desc: '支持多个路径参数' },
      { flag: '-s', desc: '去除指定后缀' },
    ],
    examples: [
      { cmd: 'basename /path/to/file.txt', desc: '提取文件名 file.txt' },
      { cmd: 'basename -s .txt file.txt', desc: '去除 .txt 后缀' },
      { cmd: 'basename -a /a/b /c/d', desc: '处理多个路径' },
    ],
    tags: ['filename', 'path', 'extract'],
  },
  {
    name: 'dirname',
    shortDesc: '提取目录路径',
    category: 'file',
    syntax: 'dirname [选项] 路径',
    description: 'dirname 命令用于从路径中提取目录部分。',
    options: [
      { flag: '-z', desc: '输出不以换行结尾' },
    ],
    examples: [
      { cmd: 'dirname /path/to/file.txt', desc: '提取目录 /path/to' },
      { cmd: 'dirname ./src/main.py', desc: '提取目录 ./src' },
    ],
    tags: ['directory', 'path', 'extract'],
  },
  {
    name: 'readlink',
    shortDesc: '读取符号链接',
    category: 'file',
    syntax: 'readlink [选项] 文件',
    description: 'readlink 命令用于读取符号链接指向的实际路径。',
    options: [
      { flag: '-f', desc: '递归解析所有符号链接' },
      { flag: '-e', desc: '解析并验证路径存在' },
      { flag: '-n', desc: '输出不追加换行' },
    ],
    examples: [
      { cmd: 'readlink link', desc: '查看链接指向' },
      { cmd: 'readlink -f /usr/bin/python', desc: '递归解析最终路径' },
    ],
    tags: ['symlink', 'resolve', 'path'],
  },
  {
    name: 'shred',
    shortDesc: '安全粉碎文件',
    category: 'file',
    syntax: 'shred [选项] 文件',
    description: 'shred 命令通过多次覆写来安全删除文件，使数据难以恢复。',
    options: [
      { flag: '-n', desc: '指定覆写次数' },
      { flag: '-u', desc: '覆写后删除文件' },
      { flag: '-z', desc: '最后一次用零覆写' },
    ],
    examples: [
      { cmd: 'shred -u secret.txt', desc: '安全粉碎并删除文件' },
      { cmd: 'shred -n 5 -z data.bin', desc: '覆写 5 次后用零填充' },
      { cmd: 'shred -vf file', desc: '显示粉碎进度' },
    ],
    tags: ['secure', 'delete', 'overwrite'],
  },
  {
    name: 'dd',
    shortDesc: '数据复制与转换',
    category: 'file',
    syntax: 'dd [选项]',
    description: 'dd 套接字命令用于低级别的数据复制和转换，常用于制作启动盘和磁盘备份。',
    options: [
      { flag: 'if=', desc: '指定输入文件' },
      { flag: 'of=', desc: '指定输出文件' },
      { flag: 'bs=', desc: '设置块大小' },
      { flag: 'status=', desc: '显示进度信息' },
    ],
    examples: [
      { cmd: 'dd if=input.iso of=/dev/sdb bs=4M', desc: '制作 USB 启动盘' },
      { cmd: 'dd if=/dev/zero of=file.img bs=1M count=100', desc: '创建 100M 空文件' },
      { cmd: 'dd if=/dev/sda of=backup.img bs=4M status=progress', desc: '整盘备份并显示进度' },
    ],
    tags: ['disk', 'clone', 'backup'],
  },

  // === 文本处理 ===
  {
    name: 'cat',
    shortDesc: '查看文件内容',
    category: 'text',
    syntax: 'cat [选项] 文件',
    description: 'cat 命令用于连接文件并输出到标准输出，常用于查看文件内容。',
    options: [
      { flag: '-n', desc: '显示行号' },
      { flag: '-b', desc: '非空行显示行号' },
      { flag: '-s', desc: '压缩连续空行' },
    ],
    examples: [
      { cmd: 'cat file.txt', desc: '查看文件内容' },
      { cmd: 'cat -n file.txt', desc: '带行号查看' },
      { cmd: 'cat a.txt b.txt > c.txt', desc: '合并多个文件' },
    ],
    tags: ['concatenate', 'view', 'file'],
  },
  {
    name: 'head',
    shortDesc: '查看文件开头',
    category: 'text',
    syntax: 'head [选项] 文件',
    description: 'head 命令用于输出文件的前几行内容，默认显示前 10 行。',
    options: [
      { flag: '-n', desc: '显示指定行数' },
      { flag: '-c', desc: '显示指定字节数' },
    ],
    examples: [
      { cmd: 'head -n 20 file.log', desc: '显示前 20 行' },
      { cmd: 'head -c 1024 data.bin', desc: '显示前 1KB 内容' },
    ],
    tags: ['beginning', 'top', 'lines'],
  },
  {
    name: 'tail',
    shortDesc: '查看文件末尾',
    category: 'text',
    syntax: 'tail [选项] 文件',
    description: 'tail 命令用于输出文件的末尾内容，支持实时追踪文件变化。',
    options: [
      { flag: '-n', desc: '显示指定行数' },
      { flag: '-f', desc: '实时追踪文件变化' },
      { flag: '-F', desc: '追踪并自动重试' },
    ],
    examples: [
      { cmd: 'tail -n 50 log.txt', desc: '显示最后 50 行' },
      { cmd: 'tail -f /var/log/syslog', desc: '实时查看日志' },
      { cmd: 'tail -f -n 100 app.log', desc: '实时追踪最后 100 行' },
    ],
    tags: ['end', 'follow', 'log'],
  },
  {
    name: 'less',
    shortDesc: '分页浏览文件',
    category: 'text',
    syntax: 'less [选项] 文件',
    description: 'less 命令用于分页浏览文件内容，支持前后翻页和搜索，适合查看大文件。',
    options: [
      { flag: '-N', desc: '显示行号' },
      { flag: '-i', desc: '搜索忽略大小写' },
      { flag: '-S', desc: '不自动换行' },
    ],
    examples: [
      { cmd: 'less -N file.txt', desc: '带行号浏览文件' },
      { cmd: 'less +F /var/log/syslog', desc: '以追踪模式打开日志' },
    ],
    tags: ['pager', 'browse', 'view'],
  },
  {
    name: 'more',
    shortDesc: '分页显示文件',
    category: 'text',
    syntax: 'more [选项] 文件',
    description: 'more 命令用于分页显示文件内容，只支持向前翻页。',
    options: [
      { flag: '-d', desc: '显示操作提示' },
      { flag: '-n', desc: '指定每屏行数' },
    ],
    examples: [
      { cmd: 'more file.txt', desc: '分页查看文件' },
      { cmd: 'more -d -10 file.txt', desc: '每屏显示 10 行并带提示' },
    ],
    tags: ['pager', 'view', 'display'],
  },
  {
    name: 'grep',
    shortDesc: '搜索文本模式',
    category: 'text',
    syntax: 'grep [选项] 模式 文件',
    description: 'grep 命令用于在文件中搜索匹配指定模式的行，支持正则表达式。',
    options: [
      { flag: '-i', desc: '忽略大小写' },
      { flag: '-r', desc: '递归搜索目录' },
      { flag: '-n', desc: '显示行号' },
      { flag: '-v', desc: '反向匹配（排除）' },
    ],
    examples: [
      { cmd: 'grep "error" log.txt', desc: '搜索包含 error 的行' },
      { cmd: 'grep -rn "TODO" src/', desc: '递归搜索并显示行号' },
      { cmd: 'grep -iv "debug" app.log', desc: '忽略大小写反向过滤' },
    ],
    tags: ['search', 'pattern', 'regex'],
  },
  {
    name: 'sed',
    shortDesc: '流编辑器',
    category: 'text',
    syntax: 'sed [选项] 命令 文件',
    description: 'sed 是流编辑器，用于对文本进行过滤和替换操作，支持正则表达式。',
    options: [
      { flag: '-i', desc: '直接修改原文件' },
      { flag: '-n', desc: '只输出经过处理的行' },
      { flag: '-e', desc: '指定多个编辑命令' },
    ],
    examples: [
      { cmd: 'sed "s/old/new/g" file.txt', desc: '全局替换文本' },
      { cmd: 'sed -i "s/foo/bar/g" file.txt', desc: '原地替换文件内容' },
      { cmd: 'sed -n "5,10p" file.txt', desc: '打印第 5 到 10 行' },
    ],
    tags: ['stream', 'edit', 'replace'],
  },
  {
    name: 'awk',
    shortDesc: '文本处理语言',
    category: 'text',
    syntax: 'awk [选项] 模式 {动作} 文件',
    description: 'awk 是强大的文本处理语言，擅长按列处理结构化文本数据。',
    options: [
      { flag: '-F', desc: '指定字段分隔符' },
      { flag: '-f', desc: '从文件读取脚本' },
      { flag: '-v', desc: '传递变量' },
    ],
    examples: [
      { cmd: "awk '{print $1}' file.txt", desc: '打印第一列' },
      { cmd: "awk -F: '{print $1}' /etc/passwd", desc: '以冒号为分隔符提取用户名' },
      { cmd: "awk 'END{print NR}' file.txt", desc: '统计总行数' },
    ],
    tags: ['text', 'process', 'column'],
  },
  {
    name: 'sort',
    shortDesc: '排序文本行',
    category: 'text',
    syntax: 'sort [选项] 文件',
    description: 'sort 命令用于对文本行进行排序，支持按字典序、数值等多种方式排序。',
    options: [
      { flag: '-n', desc: '按数值排序' },
      { flag: '-r', desc: '逆序排列' },
      { flag: '-k', desc: '按指定列排序' },
      { flag: '-u', desc: '去除重复行' },
    ],
    examples: [
      { cmd: 'sort file.txt', desc: '默认排序' },
      { cmd: 'sort -rn numbers.txt', desc: '按数值逆序排序' },
      { cmd: 'sort -t: -k3 -n /etc/passwd', desc: '按第三列数值排序' },
    ],
    tags: ['sort', 'order', 'arrange'],
  },
  {
    name: 'uniq',
    shortDesc: '去除重复行',
    category: 'text',
    syntax: 'uniq [选项] 文件',
    description: 'uniq 命令用于去除相邻的重复行。通常与 sort 配合使用。',
    options: [
      { flag: '-c', desc: '统计重复次数' },
      { flag: '-d', desc: '只显示重复行' },
      { flag: '-u', desc: '只显示不重复行' },
    ],
    examples: [
      { cmd: 'sort file.txt | uniq', desc: '排序后去重' },
      { cmd: 'sort file.txt | uniq -c', desc: '统计每行出现次数' },
      { cmd: 'sort file.txt | uniq -d', desc: '只显示有重复的行' },
    ],
    tags: ['unique', 'duplicate', 'count'],
  },
  {
    name: 'wc',
    shortDesc: '统计文件信息',
    category: 'text',
    syntax: 'wc [选项] 文件',
    description: 'wc 命令用于统计文件的行数、单词数和字节数。',
    options: [
      { flag: '-l', desc: '统计行数' },
      { flag: '-w', desc: '统计单词数' },
      { flag: '-c', desc: '统计字节数' },
    ],
    examples: [
      { cmd: 'wc -l file.txt', desc: '统计文件行数' },
      { cmd: 'wc -lw file.txt', desc: '统计行数和单词数' },
      { cmd: 'find . -name "*.py" | xargs wc -l', desc: '统计所有 Python 文件行数' },
    ],
    tags: ['count', 'word', 'line'],
  },
  {
    name: 'tr',
    shortDesc: '转换或删除字符',
    category: 'text',
    syntax: 'tr [选项] 字符集1 字符集2',
    description: 'tr 命令用于对标准输入的字符进行替换、压缩或删除操作。',
    options: [
      { flag: '-d', desc: '删除指定字符' },
      { flag: '-s', desc: '压缩重复字符' },
      { flag: '-c', desc: '取补集' },
    ],
    examples: [
      { cmd: "echo 'HELLO' | tr A-Z a-z", desc: '大写转小写' },
      { cmd: "tr -d '\\r' < win.txt > unix.txt", desc: '删除 Windows 回车符' },
      { cmd: "tr -s ' ' < file.txt", desc: '压缩多余空格' },
    ],
    tags: ['translate', 'replace', 'character'],
  },
  {
    name: 'cut',
    shortDesc: '截取文本列',
    category: 'text',
    syntax: 'cut [选项] 文件',
    description: 'cut 命令用于按列截取文本内容，可指定分隔符和字段。',
    options: [
      { flag: '-d', desc: '指定分隔符' },
      { flag: '-f', desc: '指定字段' },
      { flag: '-c', desc: '按字符位置截取' },
    ],
    examples: [
      { cmd: "cut -d: -f1 /etc/passwd", desc: '提取第一列用户名' },
      { cmd: "cut -c1-10 file.txt", desc: '截取每行前 10 个字符' },
      { cmd: "cut -d',' -f2,3 data.csv", desc: '提取 CSV 第 2、3 列' },
    ],
    tags: ['column', 'field', 'extract'],
  },
  {
    name: 'diff',
    shortDesc: '比较文件差异',
    category: 'text',
    syntax: 'diff [选项] 文件1 文件2',
    description: 'diff 命令用于逐行比较两个文件的差异，常用于代码审查和版本管理。',
    options: [
      { flag: '-u', desc: '统一格式输出' },
      { flag: '-r', desc: '递归比较目录' },
      { flag: '-i', desc: '忽略大小写' },
      { flag: '-w', desc: '忽略空白差异' },
    ],
    examples: [
      { cmd: 'diff -u old.txt new.txt', desc: '统一格式比较差异' },
      { cmd: 'diff -r dir1/ dir2/', desc: '递归比较两个目录' },
      { cmd: 'diff -iw a.txt b.txt', desc: '忽略大小写和空白比较' },
    ],
    tags: ['compare', 'difference', 'patch'],
  },
  {
    name: 'tee',
    shortDesc: '分流输出数据',
    category: 'text',
    syntax: 'tee [选项] 文件',
    description: 'tee 命令从标准输入读取数据，同时输出到标准输出和指定文件。',
    options: [
      { flag: '-a', desc: '追加而非覆盖' },
      { flag: '-i', desc: '忽略中断信号' },
    ],
    examples: [
      { cmd: 'ls -la | tee output.txt', desc: '输出到终端并写入文件' },
      { cmd: 'echo "log" | tee -a log.txt', desc: '追加日志到文件' },
      { cmd: 'make 2>&1 | tee build.log', desc: '编译并同时记录日志' },
    ],
    tags: ['pipe', 'output', 'split'],
  },
  {
    name: 'echo',
    shortDesc: '输出文本内容',
    category: 'text',
    syntax: 'echo [选项] 字符串',
    description: 'echo 命令用于在终端输出文本，支持转义字符和变量展开。',
    options: [
      { flag: '-n', desc: '不输出末尾换行' },
      { flag: '-e', desc: '启用转义字符解析' },
    ],
    examples: [
      { cmd: 'echo "Hello World"', desc: '输出字符串' },
      { cmd: 'echo -e "line1\\nline2"', desc: '输出含换行的文本' },
      { cmd: 'echo $PATH', desc: '输出环境变量' },
    ],
    tags: ['print', 'output', 'string'],
  },
  {
    name: 'printf',
    shortDesc: '格式化输出',
    category: 'text',
    syntax: 'printf 格式 参数',
    description: 'printf 命令用于格式化输出文本，类似 C 语言的 printf 函数。',
    options: [
      { flag: '%s', desc: '字符串占位符' },
      { flag: '%d', desc: '整数占位符' },
      { flag: '%f', desc: '浮点数占位符' },
    ],
    examples: [
      { cmd: 'printf "Name: %s\\n" "Alice"', desc: '格式化字符串输出' },
      { cmd: 'printf "%-10s %d\\n" "Count:" 42', desc: '左对齐格式化输出' },
    ],
    tags: ['format', 'print', 'output'],
  },
  {
    name: 'paste',
    shortDesc: '按列合并文件',
    category: 'text',
    syntax: 'paste [选项] 文件1 文件2',
    description: 'paste 命令用于将多个文件按行合并，以制表符分隔各列。',
    options: [
      { flag: '-d', desc: '指定分隔符' },
      { flag: '-s', desc: '将文件行合并为一行' },
    ],
    examples: [
      { cmd: 'paste names.txt ages.txt', desc: '按行合并两个文件' },
      { cmd: 'paste -d "," a.txt b.txt', desc: '以逗号分隔合并' },
      { cmd: 'paste -s file.txt', desc: '将所有行合并为一行' },
    ],
    tags: ['merge', 'column', 'join'],
  },
  {
    name: 'split',
    shortDesc: '拆分大文件',
    category: 'text',
    syntax: 'split [选项] 文件 前缀',
    description: 'split 命令用于将大文件拆分为多个小文件。',
    options: [
      { flag: '-l', desc: '按行数拆分' },
      { flag: '-b', desc: '按大小拆分' },
      { flag: '-d', desc: '使用数字后缀' },
    ],
    examples: [
      { cmd: 'split -l 1000 large.txt part_', desc: '每 1000 行拆分一个文件' },
      { cmd: 'split -b 10M bigfile.bin chunk_', desc: '按 10MB 拆分' },
      { cmd: 'split -l 500 -d data.txt seg_', desc: '使用数字后缀拆分' },
    ],
    tags: ['split', 'divide', 'chunk'],
  },
  {
    name: 'xargs',
    shortDesc: '构建执行命令行',
    category: 'text',
    syntax: 'xargs [选项] 命令',
    description: 'xargs 命令用于将标准输入数据转换为命令行参数，常与管道配合使用。',
    options: [
      { flag: '-n', desc: '每次传递的参数个数' },
      { flag: '-I', desc: '指定替换字符串' },
      { flag: '-p', desc: '执行前确认' },
    ],
    examples: [
      { cmd: 'find . -name "*.tmp" | xargs rm', desc: '删除所有 tmp 文件' },
      { cmd: 'cat urls.txt | xargs -n1 curl', desc: '逐个下载 URL' },
      { cmd: 'find . -type f | xargs -I{} cp {} /backup/', desc: '复制所有文件到备份目录' },
    ],
    tags: ['arguments', 'pipe', 'batch'],
  },
  {
    name: 'rev',
    shortDesc: '反转每行字符',
    category: 'text',
    syntax: 'rev [选项] 文件',
    description: 'rev 命令用于反转每行中的字符顺序。',
    options: [
      { flag: '-c', desc: '指定字符范围' },
    ],
    examples: [
      { cmd: "echo 'abcdef' | rev", desc: '输出 fedcba' },
      { cmd: 'rev file.txt', desc: '反转文件每行内容' },
    ],
    tags: ['reverse', 'mirror', 'string'],
  },
  {
    name: 'nl',
    shortDesc: '添加行号输出',
    category: 'text',
    syntax: 'nl [选项] 文件',
    description: 'nl 命令用于为文件内容添加行号后输出，支持多种行号格式。',
    options: [
      { flag: '-b', desc: '指定行号方式' },
      { flag: '-n', desc: '行号对齐方式' },
      { flag: '-s', desc: '行号后分隔符' },
    ],
    examples: [
      { cmd: 'nl file.txt', desc: '给文件加行号' },
      { cmd: 'nl -ba -nrz file.txt', desc: '所有行加右对齐补零行号' },
    ],
    tags: ['number', 'line', 'count'],
  },
  {
    name: 'column',
    shortDesc: '对齐文本列',
    category: 'text',
    syntax: 'column [选项] 文件',
    description: 'column 命令用于将文本格式化为整齐的列对齐输出。',
    options: [
      { flag: '-t', desc: '自动判断列数对齐' },
      { flag: '-s', desc: '指定分隔符' },
      { flag: '-n', desc: '不合并相邻分隔符' },
    ],
    examples: [
      { cmd: 'column -t data.txt', desc: '自动对齐列' },
      { cmd: 'column -t -s "," data.csv', desc: '按逗号分隔对齐' },
    ],
    tags: ['align', 'format', 'table'],
  },
  {
    name: 'fold',
    shortDesc: '自动换行文本',
    category: 'text',
    syntax: 'fold [选项] 文件',
    description: 'fold 命令用于将长行自动折行，控制每行的最大宽度。',
    options: [
      { flag: '-w', desc: '指定每行宽度' },
      { flag: '-s', desc: '在空格处折行' },
    ],
    examples: [
      { cmd: 'fold -w 80 file.txt', desc: '将每行折为 80 字符宽' },
      { cmd: 'fold -w 40 -s long.txt', desc: '在空格处折行，宽 40 字符' },
    ],
    tags: ['wrap', 'width', 'line'],
  },

  // === 网络工具 ===
  {
    name: 'ping',
    shortDesc: '测试网络连通性',
    category: 'network',
    syntax: 'ping [选项] 主机',
    description: '向目标主机发送 ICMP 请求包，检测网络是否可达并测量延迟。',
    options: [
      { flag: '-c', desc: '指定发送次数' },
      { flag: '-i', desc: '设置发送间隔（秒）' },
      { flag: '-s', desc: '设置数据包大小' },
    ],
    examples: [
      { cmd: 'ping -c 4 google.com', desc: '发送4个包测试连通性' },
      { cmd: 'ping -i 0.5 192.168.1.1', desc: '每0.5秒发送一次' },
      { cmd: 'ping -s 1024 example.com', desc: '发送1024字节的数据包' },
    ],
    tags: ['network', 'icmp', 'connectivity'],
  },
  {
    name: 'curl',
    shortDesc: '传输数据工具',
    category: 'network',
    syntax: 'curl [选项] URL',
    description: '功能强大的命令行数据传输工具，支持多种协议。',
    options: [
      { flag: '-o', desc: '将输出保存到文件' },
      { flag: '-X', desc: '指定 HTTP 请求方法' },
      { flag: '-H', desc: '添加请求头' },
      { flag: '-d', desc: '发送 POST 数据' },
    ],
    examples: [
      { cmd: 'curl https://example.com', desc: '获取网页内容' },
      { cmd: 'curl -X POST -d "name=test" http://api.example.com', desc: '发送 POST 请求' },
      { cmd: 'curl -o file.zip https://example.com/file.zip', desc: '下载文件' },
    ],
    tags: ['network', 'http', 'download', 'api'],
  },
  {
    name: 'wget',
    shortDesc: '下载文件工具',
    category: 'network',
    syntax: 'wget [选项] URL',
    description: '非交互式网络下载工具，支持断点续传和递归下载。',
    options: [
      { flag: '-O', desc: '指定保存文件名' },
      { flag: '-c', desc: '断点续传' },
      { flag: '-q', desc: '安静模式' },
    ],
    examples: [
      { cmd: 'wget https://example.com/file.tar.gz', desc: '下载文件' },
      { cmd: 'wget -c https://example.com/large.iso', desc: '断点续传下载大文件' },
      { cmd: 'wget -O output.html https://example.com', desc: '下载并指定文件名' },
    ],
    tags: ['network', 'download', 'file'],
  },
  {
    name: 'ssh',
    shortDesc: '远程登录主机',
    category: 'network',
    syntax: 'ssh [选项] [用户@]主机',
    description: '安全的远程登录协议，加密传输数据。',
    options: [
      { flag: '-p', desc: '指定远程端口' },
      { flag: '-i', desc: '指定私钥文件' },
      { flag: '-L', desc: '本地端口转发' },
    ],
    examples: [
      { cmd: 'ssh user@192.168.1.100', desc: '以 user 身份登录远程主机' },
      { cmd: 'ssh -p 2222 user@example.com', desc: '使用非默认端口连接' },
      { cmd: 'ssh -L 8080:localhost:80 user@server', desc: '建立本地端口转发' },
    ],
    tags: ['network', 'remote', 'login'],
  },
  {
    name: 'scp',
    shortDesc: '远程复制文件',
    category: 'network',
    syntax: 'scp [选项] 源 目标',
    description: '基于 SSH 协议在本地与远程主机间安全复制文件。',
    options: [
      { flag: '-r', desc: '递归复制目录' },
      { flag: '-P', desc: '指定远程端口' },
      { flag: '-C', desc: '启用压缩传输' },
    ],
    examples: [
      { cmd: 'scp file.txt user@server:/home/user/', desc: '上传文件到远程主机' },
      { cmd: 'scp -r user@server:/var/log/ ./logs/', desc: '递归下载远程目录' },
      { cmd: 'scp -P 2222 file.txt user@server:/tmp/', desc: '指定端口传输文件' },
    ],
    tags: ['network', 'file-transfer', 'ssh'],
  },
  {
    name: 'sftp',
    shortDesc: '安全文件传输',
    category: 'network',
    syntax: 'sftp [用户@]主机',
    description: '基于 SSH 的交互式文件传输程序。',
    options: [
      { flag: '-P', desc: '指定远程端口' },
      { flag: '-i', desc: '指定私钥文件' },
      { flag: '-b', desc: '指定批处理文件' },
    ],
    examples: [
      { cmd: 'sftp user@server', desc: '连接远程 SFTP 服务器' },
      { cmd: 'sftp -P 2222 user@server', desc: '使用指定端口连接' },
      { cmd: 'sftp -b batch.txt user@server', desc: '使用批处理文件执行命令' },
    ],
    tags: ['network', 'file-transfer', 'ssh'],
  },
  {
    name: 'rsync',
    shortDesc: '同步远程文件',
    category: 'network',
    syntax: 'rsync [选项] 源 目标',
    description: '高效的增量文件同步工具，支持本地和远程同步。',
    options: [
      { flag: '-a', desc: '归档模式，保留属性' },
      { flag: '-v', desc: '显示详细输出' },
      { flag: '-z', desc: '传输时压缩数据' },
      { flag: '--delete', desc: '删除目标端多余文件' },
    ],
    examples: [
      { cmd: 'rsync -avz ./src/ user@server:/backup/src/', desc: '压缩同步目录到远程' },
      { cmd: 'rsync -av --delete ./dst/ user@server:/dst/', desc: '镜像同步并删除多余文件' },
      { cmd: 'rsync -avz --progress bigfile user@server:/data/', desc: '同步大文件并显示进度' },
    ],
    tags: ['network', 'sync', 'backup', 'file-transfer'],
  },
  {
    name: 'netstat',
    shortDesc: '查看网络状态',
    category: 'network',
    syntax: 'netstat [选项]',
    description: '显示网络连接、路由表和接口统计等信息。',
    options: [
      { flag: '-t', desc: '显示 TCP 连接' },
      { flag: '-u', desc: '显示 UDP 连接' },
      { flag: '-l', desc: '显示监听中的端口' },
      { flag: '-n', desc: '以数字形式显示地址' },
    ],
    examples: [
      { cmd: 'netstat -tuln', desc: '查看所有监听端口' },
      { cmd: 'netstat -an | grep :80', desc: '查找80端口的连接' },
      { cmd: 'netstat -rn', desc: '显示路由表' },
    ],
    tags: ['network', 'connection', 'port'],
  },
  {
    name: 'ss',
    shortDesc: '查看套接字信息',
    category: 'network',
    syntax: 'ss [选项]',
    description: '替代 netstat 的现代工具，显示套接字统计信息。',
    options: [
      { flag: '-t', desc: '显示 TCP 套接字' },
      { flag: '-u', desc: '显示 UDP 套接字' },
      { flag: '-l', desc: '显示监听状态套接字' },
      { flag: '-n', desc: '不解析服务名称' },
    ],
    examples: [
      { cmd: 'ss -tuln', desc: '显示所有监听端口' },
      { cmd: 'ss -s', desc: '显示套接字统计摘要' },
      { cmd: 'ss -tn state established', desc: '显示所有已建立的 TCP 连接' },
    ],
    tags: ['network', 'socket', 'connection'],
  },
  {
    name: 'ip',
    shortDesc: '管理网络配置',
    category: 'network',
    syntax: 'ip [选项] 对象 {命令}',
    description: 'Linux 网络配置的瑞士军刀，管理地址、路由、链路等。',
    options: [
      { flag: 'addr', desc: '管理 IP 地址' },
      { flag: 'link', desc: '管理网络接口' },
      { flag: 'route', desc: '管理路由表' },
    ],
    examples: [
      { cmd: 'ip addr show', desc: '显示所有网络接口地址' },
      { cmd: 'ip link set eth0 up', desc: '启用网络接口' },
      { cmd: 'ip route show', desc: '显示路由表' },
    ],
    tags: ['network', 'interface', 'routing'],
  },
  {
    name: 'ifconfig',
    shortDesc: '配置网络接口',
    category: 'network',
    syntax: 'ifconfig [接口 [选项]]',
    description: '配置和显示网络接口参数（已被 ip 命令取代但仍常用）。',
    options: [
      { flag: '-a', desc: '显示所有接口' },
      { flag: 'up', desc: '启用接口' },
      { flag: 'down', desc: '禁用接口' },
    ],
    examples: [
      { cmd: 'ifconfig', desc: '显示活动网络接口信息' },
      { cmd: 'ifconfig eth0 192.168.1.10 netmask 255.255.255.0', desc: '设置接口 IP 地址' },
      { cmd: 'ifconfig eth0 down', desc: '禁用网络接口' },
    ],
    tags: ['network', 'interface', 'deprecated'],
  },
  {
    name: 'nslookup',
    shortDesc: '查询DNS记录',
    category: 'network',
    syntax: 'nslookup [主机 [服务器]]',
    description: '查询 DNS 名称服务器，获取域名解析信息。',
    options: [
      { flag: '-type=', desc: '指定查询记录类型' },
      { flag: '-debug', desc: '显示调试信息' },
    ],
    examples: [
      { cmd: 'nslookup google.com', desc: '查询域名 IP 地址' },
      { cmd: 'nslookup -type=MX gmail.com', desc: '查询 MX 邮件记录' },
      { cmd: 'nslookup example.com 8.8.8.8', desc: '使用指定 DNS 服务器查询' },
    ],
    tags: ['network', 'dns', 'lookup'],
  },
  {
    name: 'dig',
    shortDesc: 'DNS查询工具',
    category: 'network',
    syntax: 'dig [选项] [@服务器] 名称 [类型]',
    description: '灵活的 DNS 查询工具，可进行各种类型的 DNS 记录查询。',
    options: [
      { flag: '+short', desc: '简洁输出' },
      { flag: '-t', desc: '指定查询类型' },
      { flag: '-x', desc: '反向 DNS 查询' },
    ],
    examples: [
      { cmd: 'dig google.com', desc: '查询域名的 A 记录' },
      { cmd: 'dig +short example.com', desc: '仅显示 IP 地址' },
      { cmd: 'dig -x 8.8.8.8', desc: '反向查询 IP 对应的域名' },
    ],
    tags: ['network', 'dns', 'query'],
  },
  {
    name: 'host',
    shortDesc: 'DNS解析查询',
    category: 'network',
    syntax: 'host [选项] 名称 [服务器]',
    description: '简单的 DNS 查询工具，用于查找主机信息。',
    options: [
      { flag: '-a', desc: '显示详细 DNS 信息' },
      { flag: '-t', desc: '指定查询类型' },
      { flag: '-C', desc: '显示 SOA 记录' },
    ],
    examples: [
      { cmd: 'host google.com', desc: '查询域名解析结果' },
      { cmd: 'host -t MX gmail.com', desc: '查询邮件交换记录' },
      { cmd: 'host -a example.com', desc: '显示所有 DNS 记录' },
    ],
    tags: ['network', 'dns', 'resolve'],
  },
  {
    name: 'traceroute',
    shortDesc: '追踪路由路径',
    category: 'network',
    syntax: 'traceroute [选项] 主机',
    description: '追踪数据包到达目标主机所经过的路由路径。',
    options: [
      { flag: '-n', desc: '不解析主机名' },
      { flag: '-m', desc: '设置最大跳数' },
      { flag: '-p', desc: '指定目标端口' },
    ],
    examples: [
      { cmd: 'traceroute google.com', desc: '追踪到 Google 的路由' },
      { cmd: 'traceroute -n 8.8.8.8', desc: '以 IP 形式显示路由' },
      { cmd: 'traceroute -m 20 example.com', desc: '限制最大跳数为20' },
    ],
    tags: ['network', 'routing', 'diagnostic'],
  },
  {
    name: 'nc',
    shortDesc: '网络瑞士军刀',
    category: 'network',
    syntax: 'nc [选项] 主机 端口',
    description: '功能多样的网络工具，可用于端口扫描、文件传输和调试。',
    options: [
      { flag: '-l', desc: '监听模式' },
      { flag: '-v', desc: '显示详细输出' },
      { flag: '-z', desc: '零 I/O 模式，扫描端口' },
    ],
    examples: [
      { cmd: 'nc -zv 192.168.1.1 80', desc: '检测目标端口是否开放' },
      { cmd: 'nc -l 8080', desc: '在8080端口监听连接' },
      { cmd: 'nc -zv server 20-100', desc: '扫描端口范围' },
    ],
    tags: ['network', 'port', 'debug'],
  },
  {
    name: 'nmap',
    shortDesc: '网络端口扫描',
    category: 'network',
    syntax: 'nmap [选项] 目标',
    description: '网络探测和安全审计工具，用于扫描主机和端口。',
    options: [
      { flag: '-sS', desc: 'TCP SYN 扫描' },
      { flag: '-sV', desc: '探测服务版本' },
      { flag: '-O', desc: '探测操作系统' },
      { flag: '-p', desc: '指定端口范围' },
    ],
    examples: [
      { cmd: 'nmap 192.168.1.1', desc: '扫描目标主机的常见端口' },
      { cmd: 'nmap -sV -p 80,443 192.168.1.1', desc: '扫描指定端口并探测版本' },
      { cmd: 'nmap -sn 192.168.1.0/24', desc: '扫描网段内的存活主机' },
    ],
    tags: ['network', 'security', 'scan'],
  },
  {
    name: 'tcpdump',
    shortDesc: '抓取网络数据包',
    category: 'network',
    syntax: 'tcpdump [选项] [表达式]',
    description: '命令行网络数据包分析工具，捕获并显示网络流量。',
    options: [
      { flag: '-i', desc: '指定网络接口' },
      { flag: '-w', desc: '将数据包写入文件' },
      { flag: '-c', desc: '指定捕获数量' },
    ],
    examples: [
      { cmd: 'tcpdump -i eth0', desc: '捕获指定接口的所有流量' },
      { cmd: 'tcpdump -i eth0 port 80', desc: '仅捕获80端口的流量' },
      { cmd: 'tcpdump -w capture.pcap -c 100', desc: '捕获100个包并保存到文件' },
    ],
    tags: ['network', 'capture', 'debug'],
  },
  {
    name: 'lsof',
    shortDesc: '查看打开的文件',
    category: 'network',
    syntax: 'lsof [选项]',
    description: '列出当前系统打开的文件和网络连接信息。',
    options: [
      { flag: '-i', desc: '显示网络连接' },
      { flag: '-u', desc: '指定用户' },
      { flag: '-p', desc: '指定进程 ID' },
    ],
    examples: [
      { cmd: 'lsof -i :80', desc: '查看占用80端口的进程' },
      { cmd: 'lsof -u root', desc: '查看 root 用户打开的文件' },
      { cmd: 'lsof -p 1234', desc: '查看指定进程打开的文件' },
    ],
    tags: ['network', 'file', 'process'],
  },
  {
    name: 'ssh-keygen',
    shortDesc: '生成SSH密钥',
    category: 'network',
    syntax: 'ssh-keygen [选项]',
    description: '生成、管理和转换 SSH 认证密钥。',
    options: [
      { flag: '-t', desc: '指定密钥类型' },
      { flag: '-b', desc: '指定密钥位数' },
      { flag: '-f', desc: '指定密钥文件名' },
    ],
    examples: [
      { cmd: 'ssh-keygen -t rsa -b 4096', desc: '生成4096位 RSA 密钥' },
      { cmd: 'ssh-keygen -t ed25519', desc: '生成 Ed25519 密钥' },
      { cmd: 'ssh-keygen -f mykey -t ecdsa', desc: '生成 ECDSA 密钥并指定文件名' },
    ],
    tags: ['network', 'ssh', 'key', 'security'],
  },
  {
    name: 'iptables',
    shortDesc: '防火墙规则管理',
    category: 'network',
    syntax: 'iptables [选项] [规则]',
    description: 'Linux 内核级别的防火墙工具，配置网络包过滤规则。',
    options: [
      { flag: '-A', desc: '追加规则到链' },
      { flag: '-D', desc: '删除规则' },
      { flag: '-L', desc: '列出所有规则' },
      { flag: '-F', desc: '清空所有规则' },
    ],
    examples: [
      { cmd: 'iptables -L -n', desc: '列出所有防火墙规则' },
      { cmd: 'iptables -A INPUT -p tcp --dport 80 -j ACCEPT', desc: '允许80端口入站流量' },
      { cmd: 'iptables -F', desc: '清空所有防火墙规则' },
    ],
    tags: ['network', 'firewall', 'security'],
  },
  {
    name: 'ufw',
    shortDesc: '简化防火墙管理',
    category: 'network',
    syntax: 'ufw [选项] [规则]',
    description: 'Ubuntu 下的简易防火墙配置前端工具。',
    options: [
      { flag: 'allow', desc: '允许指定端口或服务' },
      { flag: 'deny', desc: '拒绝指定端口或服务' },
      { flag: 'status', desc: '显示防火墙状态' },
    ],
    examples: [
      { cmd: 'ufw allow 80/tcp', desc: '允许 TCP 80 端口' },
      { cmd: 'ufw enable', desc: '启用防火墙' },
      { cmd: 'ufw status verbose', desc: '显示防火墙详细状态' },
    ],
    tags: ['network', 'firewall', 'security'],
  },
  {
    name: 'arp',
    shortDesc: '管理ARP缓存',
    category: 'network',
    syntax: 'arp [选项]',
    description: '查看和管理系统的 ARP 缓存表。',
    options: [
      { flag: '-a', desc: '显示所有 ARP 条目' },
      { flag: '-d', desc: '删除指定 ARP 条目' },
      { flag: '-n', desc: '以数字形式显示地址' },
    ],
    examples: [
      { cmd: 'arp -a', desc: '显示所有 ARP 缓存条目' },
      { cmd: 'arp -d 192.168.1.1', desc: '删除指定 IP 的 ARP 条目' },
      { cmd: 'arp -n', desc: '以数字形式显示 ARP 表' },
    ],
    tags: ['network', 'arp', 'layer2'],
  },
  {
    name: 'route',
    shortDesc: '管理路由表',
    category: 'network',
    syntax: 'route [选项] [命令]',
    description: '查看和修改内核路由表（已被 ip route 取代）。',
    options: [
      { flag: '-n', desc: '以数字形式显示地址' },
      { flag: 'add', desc: '添加路由' },
      { flag: 'del', desc: '删除路由' },
    ],
    examples: [
      { cmd: 'route -n', desc: '显示路由表' },
      { cmd: 'route add default gw 192.168.1.1', desc: '添加默认网关' },
      { cmd: 'route del -net 10.0.0.0 netmask 255.0.0.0', desc: '删除指定路由' },
    ],
    tags: ['network', 'routing', 'gateway'],
  },

  // === 进程管理 ===
  {
    name: 'ps',
    shortDesc: '查看进程状态',
    category: 'process',
    syntax: 'ps [选项]',
    description: '显示当前系统中进程的快照信息。',
    options: [
      { flag: 'aux', desc: '显示所有进程的详细信息' },
      { flag: '-ef', desc: '全格式显示所有进程' },
      { flag: '--forest', desc: '以树形结构显示进程' },
    ],
    examples: [
      { cmd: 'ps aux', desc: '查看系统所有进程' },
      { cmd: 'ps -ef | grep nginx', desc: '查找 nginx 相关进程' },
      { cmd: 'ps aux --forest', desc: '以树形结构查看进程' },
    ],
    tags: ['process', 'monitor', 'info'],
  },
  {
    name: 'top',
    shortDesc: '实时监控进程',
    category: 'process',
    syntax: 'top [选项]',
    description: '实时显示系统中各个进程的资源占用状况。',
    options: [
      { flag: '-p', desc: '监控指定 PID' },
      { flag: '-u', desc: '只显示指定用户的进程' },
      { flag: '-d', desc: '设置刷新间隔（秒）' },
    ],
    examples: [
      { cmd: 'top', desc: '启动实时进程监控' },
      { cmd: 'top -u nginx', desc: '只显示 nginx 用户的进程' },
      { cmd: 'top -d 2', desc: '每2秒刷新一次' },
    ],
    tags: ['process', 'monitor', 'cpu'],
  },
  {
    name: 'htop',
    shortDesc: '交互式进程监控',
    category: 'process',
    syntax: 'htop [选项]',
    description: '增强版的 top 命令，支持鼠标操作和更好的交互体验。',
    options: [
      { flag: '-u', desc: '只显示指定用户的进程' },
      { flag: '-p', desc: '只显示指定 PID' },
      { flag: '-s', desc: '按指定字段排序' },
    ],
    examples: [
      { cmd: 'htop', desc: '启动交互式进程监控' },
      { cmd: 'htop -u root', desc: '只显示 root 的进程' },
      { cmd: 'htop -s PERCENT_CPU', desc: '按 CPU 使用率排序' },
    ],
    tags: ['process', 'monitor', 'interactive'],
  },
  {
    name: 'kill',
    shortDesc: '终止指定进程',
    category: 'process',
    syntax: 'kill [选项] PID',
    description: '向指定进程发送信号，默认发送 TERM 信号终止进程。',
    options: [
      { flag: '-9', desc: '强制终止进程（SIGKILL）' },
      { flag: '-15', desc: '正常终止进程（SIGTERM）' },
      { flag: '-l', desc: '列出所有信号名称' },
    ],
    examples: [
      { cmd: 'kill 1234', desc: '正常终止进程' },
      { cmd: 'kill -9 1234', desc: '强制终止进程' },
      { cmd: 'kill -l', desc: '列出所有可用信号' },
    ],
    tags: ['process', 'signal', 'terminate'],
  },
  {
    name: 'killall',
    shortDesc: '按名称终止进程',
    category: 'process',
    syntax: 'killall [选项] 进程名',
    description: '根据进程名称终止所有匹配的进程。',
    options: [
      { flag: '-9', desc: '强制终止' },
      { flag: '-i', desc: '交互式确认' },
      { flag: '-r', desc: '使用正则匹配进程名' },
    ],
    examples: [
      { cmd: 'killall nginx', desc: '终止所有 nginx 进程' },
      { cmd: 'killall -9 python', desc: '强制终止所有 python 进程' },
      { cmd: 'killall -i node', desc: '交互式确认终止 node 进程' },
    ],
    tags: ['process', 'signal', 'terminate'],
  },
  {
    name: 'pkill',
    shortDesc: '按模式终止进程',
    category: 'process',
    syntax: 'pkill [选项] 模式',
    description: '根据扩展正则表达式匹配进程并终止。',
    options: [
      { flag: '-f', desc: '匹配完整命令行' },
      { flag: '-u', desc: '匹配指定用户的进程' },
      { flag: '-9', desc: '强制终止' },
    ],
    examples: [
      { cmd: 'pkill -f "python app.py"', desc: '终止匹配命令行的进程' },
      { cmd: 'pkill -u guest', desc: '终止 guest 用户的所有进程' },
      { cmd: 'pkill nginx', desc: '终止名称包含 nginx 的进程' },
    ],
    tags: ['process', 'pattern', 'terminate'],
  },
  {
    name: 'nice',
    shortDesc: '设置进程优先级',
    category: 'process',
    syntax: 'nice [选项] 命令',
    description: '以指定的优先级运行命令，优先级范围 -20 到 19。',
    options: [
      { flag: '-n', desc: '设置 nice 值（优先级）' },
    ],
    examples: [
      { cmd: 'nice -n 10 ./backup.sh', desc: '以较低优先级运行备份脚本' },
      { cmd: 'nice -n -5 ./important_task', desc: '以较高优先级运行任务' },
    ],
    tags: ['process', 'priority', 'scheduling'],
  },
  {
    name: 'renice',
    shortDesc: '修改进程优先级',
    category: 'process',
    syntax: 'renice [选项] 优先级 PID',
    description: '修改正在运行进程的调度优先级。',
    options: [
      { flag: '-n', desc: '指定新的 nice 值' },
      { flag: '-p', desc: '指定进程 ID' },
      { flag: '-u', desc: '指定用户的所有进程' },
    ],
    examples: [
      { cmd: 'renice -n 5 -p 1234', desc: '降低指定进程的优先级' },
      { cmd: 'renice -n -3 -p 5678', desc: '提高指定进程的优先级' },
      { cmd: 'renice -n 10 -u guest', desc: '降低 guest 用户所有进程优先级' },
    ],
    tags: ['process', 'priority', 'scheduling'],
  },
  {
    name: 'nohup',
    shortDesc: '忽略挂断运行',
    category: 'process',
    syntax: 'nohup 命令 [参数]',
    description: '运行命令使其在终端关闭后继续执行，输出默认写入 nohup.out。',
    options: [
      { flag: '&', desc: '在后台运行' },
    ],
    examples: [
      { cmd: 'nohup ./server &', desc: '后台运行服务，忽略挂断信号' },
      { cmd: 'nohup python train.py > train.log 2>&1 &', desc: '后台运行并重定向输出' },
    ],
    tags: ['process', 'background', 'persistent'],
  },
  {
    name: 'bg',
    shortDesc: '恢复后台运行',
    category: 'process',
    syntax: 'bg [作业号]',
    description: '将挂起的作业放到后台继续运行。',
    options: [
      { flag: '%n', desc: '指定作业号' },
    ],
    examples: [
      { cmd: 'bg', desc: '恢复最近的挂起作业到后台' },
      { cmd: 'bg %2', desc: '将2号作业放到后台运行' },
    ],
    tags: ['process', 'background', 'job'],
  },
  {
    name: 'fg',
    shortDesc: '恢复前台运行',
    category: 'process',
    syntax: 'fg [作业号]',
    description: '将后台作业切换到前台运行。',
    options: [
      { flag: '%n', desc: '指定作业号' },
    ],
    examples: [
      { cmd: 'fg', desc: '将最近的作业切换到前台' },
      { cmd: 'fg %3', desc: '将3号作业切换到前台' },
    ],
    tags: ['process', 'foreground', 'job'],
  },
  {
    name: 'jobs',
    shortDesc: '查看后台作业',
    category: 'process',
    syntax: 'jobs [选项]',
    description: '列出当前 Shell 会话中的后台作业。',
    options: [
      { flag: '-l', desc: '显示 PID' },
      { flag: '-p', desc: '仅显示 PID' },
    ],
    examples: [
      { cmd: 'jobs', desc: '列出当前所有后台作业' },
      { cmd: 'jobs -l', desc: '列出作业及其 PID' },
      { cmd: 'jobs -p', desc: '仅显示作业的 PID' },
    ],
    tags: ['process', 'job', 'background'],
  },
  {
    name: 'crontab',
    shortDesc: '管理定时任务',
    category: 'process',
    syntax: 'crontab [选项]',
    description: '管理用户的定时任务（cron job）。',
    options: [
      { flag: '-e', desc: '编辑定时任务' },
      { flag: '-l', desc: '列出定时任务' },
      { flag: '-r', desc: '删除所有定时任务' },
    ],
    examples: [
      { cmd: 'crontab -e', desc: '编辑当前用户的定时任务' },
      { cmd: 'crontab -l', desc: '列出所有定时任务' },
      { cmd: 'crontab -l -u root', desc: '列出 root 用户的定时任务' },
    ],
    tags: ['process', 'schedule', 'cron'],
  },
  {
    name: 'systemctl',
    shortDesc: '管理系统服务',
    category: 'process',
    syntax: 'systemctl [命令] [服务]',
    description: '管理 systemd 系统和服务管理器。',
    options: [
      { flag: 'start', desc: '启动服务' },
      { flag: 'stop', desc: '停止服务' },
      { flag: 'status', desc: '查看服务状态' },
      { flag: 'enable', desc: '设置开机自启' },
    ],
    examples: [
      { cmd: 'systemctl start nginx', desc: '启动 nginx 服务' },
      { cmd: 'systemctl status sshd', desc: '查看 SSH 服务状态' },
      { cmd: 'systemctl enable --now docker', desc: '启用并立即启动 Docker' },
    ],
    tags: ['process', 'service', 'systemd'],
  },
  {
    name: 'service',
    shortDesc: '管理系统服务',
    category: 'process',
    syntax: 'service 服务名 命令',
    description: '传统的系统服务管理工具（SysVinit 风格）。',
    options: [
      { flag: 'start', desc: '启动服务' },
      { flag: 'stop', desc: '停止服务' },
      { flag: 'restart', desc: '重启服务' },
    ],
    examples: [
      { cmd: 'service nginx restart', desc: '重启 nginx 服务' },
      { cmd: 'service ssh status', desc: '查看 SSH 服务状态' },
      { cmd: 'service --status-all', desc: '列出所有服务状态' },
    ],
    tags: ['process', 'service', 'sysvinit'],
  },
  {
    name: 'watch',
    shortDesc: '定时执行命令',
    category: 'process',
    syntax: 'watch [选项] 命令',
    description: '定期执行命令并全屏显示输出结果。',
    options: [
      { flag: '-n', desc: '设置执行间隔（秒）' },
      { flag: '-d', desc: '高亮显示变化部分' },
    ],
    examples: [
      { cmd: 'watch -n 1 "date"', desc: '每秒刷新显示当前时间' },
      { cmd: 'watch -d "free -h"', desc: '高亮显示内存变化' },
      { cmd: 'watch -n 5 "df -h"', desc: '每5秒刷新磁盘使用情况' },
    ],
    tags: ['process', 'monitor', 'repeat'],
  },
  {
    name: 'screen',
    shortDesc: '终端多路复用',
    category: 'process',
    syntax: 'screen [选项] [命令]',
    description: '全屏终端多路复用器，支持会话 detach 和恢复。',
    options: [
      { flag: '-S', desc: '创建指定名称的会话' },
      { flag: '-r', desc: '恢复指定会话' },
      { flag: '-ls', desc: '列出所有会话' },
    ],
    examples: [
      { cmd: 'screen -S dev', desc: '创建名为 dev 的会话' },
      { cmd: 'screen -r dev', desc: '恢复 dev 会话' },
      { cmd: 'screen -ls', desc: '列出所有 screen 会话' },
    ],
    tags: ['process', 'terminal', 'multiplexer'],
  },
  {
    name: 'tmux',
    shortDesc: '终端复用器',
    category: 'process',
    syntax: 'tmux [选项] [命令]',
    description: '现代化的终端复用器，支持分屏、会话管理等功能。',
    options: [
      { flag: 'new -s', desc: '创建命名会话' },
      { flag: 'attach -t', desc: '连接指定会话' },
      { flag: 'ls', desc: '列出所有会话' },
    ],
    examples: [
      { cmd: 'tmux new -s work', desc: '创建名为 work 的会话' },
      { cmd: 'tmux attach -t work', desc: '连接 work 会话' },
      { cmd: 'tmux ls', desc: '列出所有 tmux 会话' },
    ],
    tags: ['process', 'terminal', 'multiplexer'],
  },
  {
    name: 'pgrep',
    shortDesc: '按名称查找进程',
    category: 'process',
    syntax: 'pgrep [选项] 模式',
    description: '根据名称或其他属性查找进程 ID。',
    options: [
      { flag: '-f', desc: '匹配完整命令行' },
      { flag: '-u', desc: '匹配指定用户' },
      { flag: '-l', desc: '同时显示进程名' },
    ],
    examples: [
      { cmd: 'pgrep nginx', desc: '查找 nginx 进程的 PID' },
      { cmd: 'pgrep -f "python app.py"', desc: '匹配完整命令行查找' },
      { cmd: 'pgrep -lu root', desc: '查找 root 用户进程并显示名称' },
    ],
    tags: ['process', 'search', 'pid'],
  },
  {
    name: 'pstree',
    shortDesc: '显示进程树',
    category: 'process',
    syntax: 'pstree [选项] [PID]',
    description: '以树形结构显示进程间的父子关系。',
    options: [
      { flag: '-p', desc: '显示进程 ID' },
      { flag: '-u', desc: '显示用户名' },
      { flag: '-h', desc: '高亮当前进程及其祖先' },
    ],
    examples: [
      { cmd: 'pstree', desc: '显示完整进程树' },
      { cmd: 'pstree -p', desc: '显示带 PID 的进程树' },
      { cmd: 'pstree -u root', desc: '显示 root 用户进程树' },
    ],
    tags: ['process', 'tree', 'hierarchy'],
  },
  {
    name: 'timeout',
    shortDesc: '限时运行命令',
    category: 'process',
    syntax: 'timeout [选项] 时长 命令',
    description: '在指定时间限制内运行命令，超时后终止。',
    options: [
      { flag: '-s', desc: '指定超时发送的信号' },
      { flag: '-k', desc: '超时后发送 SIGKILL 的时间' },
    ],
    examples: [
      { cmd: 'timeout 10s ping google.com', desc: '限制 ping 只运行10秒' },
      { cmd: 'timeout 5m ./long_task.sh', desc: '限制脚本最多运行5分钟' },
      { cmd: 'timeout -s SIGKILL 30 ./app', desc: '超时30秒后强制终止' },
    ],
    tags: ['process', 'time', 'limit'],
  },
  {
    name: 'disown',
    shortDesc: '脱离Shell控制',
    category: 'process',
    syntax: 'disown [选项] [作业号]',
    description: '将作业从 Shell 的作业表中移除，使其不受 Shell 退出影响。',
    options: [
      { flag: '-h', desc: '标记不接收 SIGHUP' },
      { flag: '-a', desc: '操作所有作业' },
      { flag: '-r', desc: '仅操作运行中的作业' },
    ],
    examples: [
      { cmd: 'disown %1', desc: '将1号作业脱离 Shell' },
      { cmd: 'disown -a', desc: '将所有作业脱离 Shell' },
      { cmd: 'disown -h %2', desc: '标记2号作业忽略挂断信号' },
    ],
    tags: ['process', 'background', 'job'],
  },

  // === 用户权限 ===
  {
    name: 'useradd',
    shortDesc: '创建用户账户',
    category: 'user',
    syntax: 'useradd [选项] 用户名',
    description: 'useradd 命令用于创建新的系统用户账户，可指定主目录、Shell 和用户组。',
    options: [
      { flag: '-m', desc: '创建用户主目录' },
      { flag: '-s', desc: '指定登录Shell' },
      { flag: '-g', desc: '指定用户初始组' },
      { flag: '-G', desc: '指定用户附加组' },
      { flag: '-d', desc: '指定用户主目录路径' },
      { flag: '-u', desc: '指定用户UID' },
    ],
    examples: [
      { cmd: 'useradd -m -s /bin/bash newuser', desc: '创建用户并设置Shell' },
      { cmd: 'useradd -m -G docker,wheel devuser', desc: '创建用户并加入多个附加组' },
      { cmd: 'useradd -u 1500 -g developers testuser', desc: '创建用户并指定UID和初始组' },
    ],
    tags: ['user', 'add', 'create'],
  },
  {
    name: 'usermod',
    shortDesc: '修改用户账户信息',
    category: 'user',
    syntax: 'usermod [选项] 用户名',
    description: 'usermod 命令用于修改已有用户账户的属性，如主目录、Shell、用户组等。',
    options: [
      { flag: '-aG', desc: '将用户追加到附加组' },
      { flag: '-s', desc: '修改登录Shell' },
      { flag: '-d', desc: '修改用户主目录' },
      { flag: '-l', desc: '修改用户名' },
      { flag: '-L', desc: '锁定用户账户' },
      { flag: '-U', desc: '解锁用户账户' },
    ],
    examples: [
      { cmd: 'usermod -aG docker username', desc: '将用户加入docker附加组' },
      { cmd: 'usermod -s /bin/zsh username', desc: '修改用户的默认Shell' },
      { cmd: 'usermod -L username', desc: '锁定用户账户' },
    ],
    tags: ['user', 'modify', 'group'],
  },
  {
    name: 'userdel',
    shortDesc: '删除用户账户',
    category: 'user',
    syntax: 'userdel [选项] 用户名',
    description: 'userdel 命令用于删除系统中的用户账户，可选择同时删除主目录和邮件目录。',
    options: [
      { flag: '-r', desc: '删除用户主目录和邮件目录' },
      { flag: '-f', desc: '强制删除用户' },
    ],
    examples: [
      { cmd: 'userdel -r username', desc: '删除用户及其主目录' },
      { cmd: 'userdel username', desc: '仅删除用户账户，保留主目录' },
    ],
    tags: ['user', 'delete', 'remove'],
  },
  {
    name: 'passwd',
    shortDesc: '设置或更改用户密码',
    category: 'user',
    syntax: 'passwd [选项] [用户名]',
    description: 'passwd 命令用于设置或更改用户密码，管理员可修改任意用户密码。',
    options: [
      { flag: '-l', desc: '锁定用户密码' },
      { flag: '-u', desc: '解锁用户密码' },
      { flag: '-d', desc: '删除用户密码' },
      { flag: '-e', desc: '使密码立即过期' },
      { flag: '-S', desc: '显示密码状态' },
    ],
    examples: [
      { cmd: 'passwd', desc: '修改当前用户密码' },
      { cmd: 'passwd username', desc: '修改指定用户密码（需root）' },
      { cmd: 'passwd -l username', desc: '锁定用户密码' },
    ],
    tags: ['user', 'password', 'security'],
  },
  {
    name: 'su',
    shortDesc: '切换用户身份',
    category: 'user',
    syntax: 'su [选项] [用户名]',
    description: 'su 命令用于切换当前用户身份，默认切换到root用户。',
    options: [
      { flag: '-', desc: '模拟完整登录（加载用户环境变量）' },
      { flag: '-c', desc: '执行指定命令后返回' },
      { flag: '-s', desc: '指定Shell' },
    ],
    examples: [
      { cmd: 'su -', desc: '切换到root用户并加载环境' },
      { cmd: 'su - username', desc: '切换到指定用户' },
      { cmd: 'su -c "whoami" postgres', desc: '以postgres用户执行命令' },
    ],
    tags: ['user', 'switch', 'root'],
  },
  {
    name: 'sudo',
    shortDesc: '以其他用户身份执行命令',
    category: 'user',
    syntax: 'sudo [选项] 命令',
    description: 'sudo 命令允许普通用户以超级用户或其他用户身份执行命令，需在sudoers中配置权限。',
    options: [
      { flag: '-u', desc: '以指定用户身份执行' },
      { flag: '-i', desc: '模拟初始登录' },
      { flag: '-s', desc: '以root身份启动Shell' },
      { flag: '-l', desc: '列出当前用户的sudo权限' },
      { flag: '-k', desc: '清除缓存的密码' },
    ],
    examples: [
      { cmd: 'sudo apt update', desc: '以root权限更新软件包列表' },
      { cmd: 'sudo -u postgres psql', desc: '以postgres用户身份运行psql' },
      { cmd: 'sudo -i', desc: '切换到root交互式Shell' },
    ],
    tags: ['user', 'root', 'privilege'],
  },
  {
    name: 'groups',
    shortDesc: '显示用户所属组',
    category: 'user',
    syntax: 'groups [用户名]',
    description: 'groups 命令用于显示指定用户所属的所有用户组。',
    options: [],
    examples: [
      { cmd: 'groups', desc: '显示当前用户所属组' },
      { cmd: 'groups username', desc: '显示指定用户所属组' },
    ],
    tags: ['user', 'group'],
  },
  {
    name: 'id',
    shortDesc: '显示用户UID和GID信息',
    category: 'user',
    syntax: 'id [选项] [用户名]',
    description: 'id 命令用于显示用户的真实和有效UID、GID以及所属的附加组信息。',
    options: [
      { flag: '-u', desc: '只显示UID' },
      { flag: '-g', desc: '只显示GID' },
      { flag: '-G', desc: '显示所有附加组ID' },
      { flag: '-n', desc: '显示名称而非数字' },
    ],
    examples: [
      { cmd: 'id', desc: '显示当前用户的ID信息' },
      { cmd: 'id -un', desc: '显示当前用户名称' },
      { cmd: 'id username', desc: '显示指定用户的ID信息' },
    ],
    tags: ['user', 'uid', 'gid'],
  },
  {
    name: 'whoami',
    shortDesc: '显示当前用户名',
    category: 'user',
    syntax: 'whoami',
    description: 'whoami 命令用于显示当前有效用户的名字，等同于 id -un。',
    options: [],
    examples: [
      { cmd: 'whoami', desc: '显示当前用户名' },
    ],
    tags: ['user', 'identity'],
  },
  {
    name: 'who',
    shortDesc: '显示已登录用户列表',
    category: 'user',
    syntax: 'who [选项]',
    description: 'who 命令用于显示当前登录到系统的所有用户信息。',
    options: [
      { flag: '-b', desc: '显示上次系统启动时间' },
      { flag: '-q', desc: '只显示用户名和登录数量' },
      { flag: '-H', desc: '显示列标题' },
      { flag: '-a', desc: '显示所有信息' },
    ],
    examples: [
      { cmd: 'who', desc: '显示当前登录用户' },
      { cmd: 'who -b', desc: '显示系统最后启动时间' },
      { cmd: 'who -aH', desc: '显示所有信息并带标题' },
    ],
    tags: ['user', 'login', 'session'],
  },
  {
    name: 'w',
    shortDesc: '显示登录用户及其活动',
    category: 'user',
    syntax: 'w [选项] [用户名]',
    description: 'w 命令用于显示当前登录用户的信息以及他们正在执行的进程。',
    options: [
      { flag: '-h', desc: '不显示标题' },
      { flag: '-s', desc: '简短格式' },
      { flag: '-u', desc: '忽略用户名' },
    ],
    examples: [
      { cmd: 'w', desc: '显示所有登录用户及其活动' },
      { cmd: 'w username', desc: '显示指定用户的活动' },
    ],
    tags: ['user', 'login', 'activity'],
  },
  {
    name: 'last',
    shortDesc: '显示用户最近登录记录',
    category: 'user',
    syntax: 'last [选项] [用户名]',
    description: 'last 命令用于显示用户最近的登录记录，数据来源于/var/log/wtmp文件。',
    options: [
      { flag: '-n', desc: '指定显示的记录条数' },
      { flag: '-f', desc: '指定记录文件' },
      { flag: '-x', desc: '显示系统关机和运行级别变化' },
    ],
    examples: [
      { cmd: 'last', desc: '显示所有用户最近登录记录' },
      { cmd: 'last -n 5 username', desc: '显示指定用户最近5次登录' },
      { cmd: 'last -x', desc: '显示系统关机和重启记录' },
    ],
    tags: ['user', 'login', 'log'],
  },
  {
    name: 'chage',
    shortDesc: '修改用户密码过期策略',
    category: 'user',
    syntax: 'chage [选项] 用户名',
    description: 'chage 命令用于修改用户密码的过期信息，包括最大/最小使用天数和过期日期等。',
    options: [
      { flag: '-l', desc: '列出用户密码过期信息' },
      { flag: '-M', desc: '密码最大有效天数' },
      { flag: '-m', desc: '密码最小使用天数' },
      { flag: '-E', desc: '设置账户过期日期' },
      { flag: '-W', desc: '密码过期前警告天数' },
    ],
    examples: [
      { cmd: 'chage -l username', desc: '查看用户密码过期信息' },
      { cmd: 'chage -M 90 username', desc: '设置密码90天后过期' },
      { cmd: 'chage -E 2025-12-31 username', desc: '设置账户过期日期' },
    ],
    tags: ['user', 'password', 'expire'],
  },
  {
    name: 'visudo',
    shortDesc: '安全编辑sudoers文件',
    category: 'user',
    syntax: 'visudo [选项]',
    description: 'visudo 命令用于安全地编辑/etc/sudoers文件，会自动进行语法检查，防止配置错误。',
    options: [
      { flag: '-c', desc: '仅检查语法' },
      { flag: '-f', desc: '指定sudoers文件路径' },
    ],
    examples: [
      { cmd: 'visudo', desc: '编辑sudoers文件' },
      { cmd: 'visudo -c', desc: '检查sudoers文件语法' },
    ],
    tags: ['user', 'sudo', 'config'],
  },
  {
    name: 'newgrp',
    shortDesc: '切换用户当前组',
    category: 'user',
    syntax: 'newgrp [组名]',
    description: 'newgrp 命令用于将当前用户的初始组切换为指定的组，新创建的文件将使用新组。',
    options: [],
    examples: [
      { cmd: 'newgrp docker', desc: '切换当前组为docker组' },
      { cmd: 'newgrp developers', desc: '切换当前组为developers组' },
    ],
    tags: ['user', 'group', 'switch'],
  },
  {
    name: 'gpasswd',
    shortDesc: '管理用户组密码和成员',
    category: 'user',
    syntax: 'gpasswd [选项] 组名',
    description: 'gpasswd 命令用于管理/etc/group文件，可添加/删除组成员以及设置组管理员。',
    options: [
      { flag: '-a', desc: '向组中添加用户' },
      { flag: '-d', desc: '从组中删除用户' },
      { flag: '-M', desc: '设置组成员列表' },
      { flag: '-A', desc: '设置组管理员' },
    ],
    examples: [
      { cmd: 'gpasswd -a username docker', desc: '将用户添加到docker组' },
      { cmd: 'gpasswd -d username docker', desc: '将用户从docker组移除' },
      { cmd: 'gpasswd -M user1,user2 developers', desc: '设置developers组成员' },
    ],
    tags: ['user', 'group', 'admin'],
  },

  // === 磁盘存储 ===
  {
    name: 'mount',
    shortDesc: '挂载文件系统',
    category: 'disk',
    syntax: 'mount [选项] 设备 挂载点',
    description: 'mount 命令用于将文件系统挂载到指定目录，使存储设备的内容可被访问。',
    options: [
      { flag: '-t', desc: '指定文件系统类型' },
      { flag: '-o', desc: '指定挂载选项' },
      { flag: '-a', desc: '挂载/etc/fstab中所有文件系统' },
      { flag: '-r', desc: '以只读模式挂载' },
      { flag: '-n', desc: '不写入/etc/mtab' },
    ],
    examples: [
      { cmd: 'mount /dev/sdb1 /mnt/usb', desc: '将分区挂载到指定目录' },
      { cmd: 'mount -t nfs 192.168.1.100:/share /mnt/nfs', desc: '挂载NFS网络共享' },
      { cmd: 'mount -o ro /dev/sr0 /mnt/cdrom', desc: '以只读模式挂载光盘' },
    ],
    tags: ['disk', 'mount', 'filesystem'],
  },
  {
    name: 'umount',
    shortDesc: '卸载文件系统',
    category: 'disk',
    syntax: 'umount [选项] 挂载点|设备',
    description: 'umount 命令用于卸载已挂载的文件系统，卸载前需确保没有进程在使用。',
    options: [
      { flag: '-f', desc: '强制卸载' },
      { flag: '-l', desc: '延迟卸载（空闲时完成）' },
      { flag: '-a', desc: '卸载所有文件系统' },
    ],
    examples: [
      { cmd: 'umount /mnt/usb', desc: '卸载指定挂载点' },
      { cmd: 'umount -f /mnt/nfs', desc: '强制卸载NFS共享' },
      { cmd: 'umount -l /mnt/usb', desc: '延迟卸载USB设备' },
    ],
    tags: ['disk', 'unmount', 'filesystem'],
  },
  {
    name: 'fdisk',
    shortDesc: '磁盘分区管理工具',
    category: 'disk',
    syntax: 'fdisk [选项] 设备',
    description: 'fdisk 命令用于创建、删除、修改磁盘分区表，是Linux下常用的磁盘分区工具。',
    options: [
      { flag: '-l', desc: '列出所有分区表' },
      { flag: '-n', desc: '创建新分区' },
      { flag: '-d', desc: '删除分区' },
      { flag: '-p', desc: '打印分区表' },
      { flag: '-t', desc: '更改分区类型' },
    ],
    examples: [
      { cmd: 'fdisk -l', desc: '列出所有磁盘分区信息' },
      { cmd: 'fdisk /dev/sdb', desc: '进入交互式分区管理' },
    ],
    tags: ['disk', 'partition', 'fdisk'],
  },
  {
    name: 'lsblk',
    shortDesc: '列出块设备信息',
    category: 'disk',
    syntax: 'lsblk [选项]',
    description: 'lsblk 命令用于列出系统中所有块设备的信息，以树状结构展示设备关系。',
    options: [
      { flag: '-f', desc: '显示文件系统信息' },
      { flag: '-m', desc: '显示权限信息' },
      { flag: '-o', desc: '指定输出列' },
      { flag: '-l', desc: '以列表形式显示' },
    ],
    examples: [
      { cmd: 'lsblk', desc: '以树状结构显示块设备' },
      { cmd: 'lsblk -f', desc: '显示文件系统类型和UUID' },
      { cmd: 'lsblk -o NAME,SIZE,TYPE,MOUNTPOINT', desc: '自定义显示列' },
    ],
    tags: ['disk', 'block', 'device'],
  },
  {
    name: 'blkid',
    shortDesc: '查询块设备UUID和文件系统',
    category: 'disk',
    syntax: 'blkid [选项] [设备]',
    description: 'blkid 命令用于查询块设备的UUID、文件系统类型等属性信息。',
    options: [
      { flag: '-o', desc: '指定输出格式' },
      { flag: '-s', desc: '指定显示的标签' },
      { flag: '-U', desc: '根据UUID查找设备' },
    ],
    examples: [
      { cmd: 'blkid', desc: '显示所有块设备的UUID信息' },
      { cmd: 'blkid /dev/sda1', desc: '显示指定分区的信息' },
    ],
    tags: ['disk', 'uuid', 'filesystem'],
  },
  {
    name: 'mkfs',
    shortDesc: '创建文件系统',
    category: 'disk',
    syntax: 'mkfs [选项] -t 类型 设备',
    description: 'mkfs 命令用于在磁盘分区上创建指定的文件系统，如ext4、xfs等。',
    options: [
      { flag: '-t', desc: '指定文件系统类型' },
      { flag: '-c', desc: '创建前检查坏块' },
      { flag: '-L', desc: '设置卷标' },
    ],
    examples: [
      { cmd: 'mkfs -t ext4 /dev/sdb1', desc: '格式化为ext4文件系统' },
      { cmd: 'mkfs -t xfs /dev/sdc1', desc: '格式化为xfs文件系统' },
      { cmd: 'mkfs -t ext4 -L DATA /dev/sdb1', desc: '格式化并设置卷标' },
    ],
    tags: ['disk', 'format', 'filesystem'],
  },
  {
    name: 'fsck',
    shortDesc: '检查并修复文件系统',
    category: 'disk',
    syntax: 'fsck [选项] 设备',
    description: 'fsck 命令用于检查并修复Linux文件系统中的错误，通常在卸载状态下运行。',
    options: [
      { flag: '-a', desc: '自动修复' },
      { flag: '-r', desc: '交互式修复' },
      { flag: '-y', desc: '对所有问题回答yes' },
      { flag: '-t', desc: '指定文件系统类型' },
    ],
    examples: [
      { cmd: 'fsck /dev/sda1', desc: '检查并修复分区' },
      { cmd: 'fsck -y /dev/sdb1', desc: '自动修复所有错误' },
      { cmd: 'fsck -t ext4 /dev/sda1', desc: '检查ext4文件系统' },
    ],
    tags: ['disk', 'check', 'repair'],
  },
  {
    name: 'df',
    shortDesc: '显示文件系统磁盘使用情况',
    category: 'disk',
    syntax: 'df [选项] [文件]',
    description: 'df 命令用于显示文件系统的磁盘空间使用情况，包括已用空间、可用空间等。',
    options: [
      { flag: '-h', desc: '以人类可读格式显示' },
      { flag: '-T', desc: '显示文件系统类型' },
      { flag: '-i', desc: '显示inode使用情况' },
      { flag: '-t', desc: '只显示指定类型的文件系统' },
    ],
    examples: [
      { cmd: 'df -h', desc: '以人类可读格式显示磁盘使用' },
      { cmd: 'df -Th', desc: '显示文件系统类型和磁盘使用' },
      { cmd: 'df -i', desc: '显示inode使用情况' },
    ],
    tags: ['disk', 'usage', 'space'],
  },
  {
    name: 'du',
    shortDesc: '显示目录磁盘使用量',
    category: 'disk',
    syntax: 'du [选项] [目录]',
    description: 'du 命令用于估算文件和目录的磁盘空间使用量。',
    options: [
      { flag: '-h', desc: '以人类可读格式显示' },
      { flag: '-s', desc: '只显示总计' },
      { flag: '-a', desc: '显示所有文件大小' },
      { flag: '-d', desc: '指定显示深度' },
      { flag: '--max-depth', desc: '指定递归深度' },
    ],
    examples: [
      { cmd: 'du -sh /home', desc: '显示home目录总大小' },
      { cmd: 'du -h --max-depth=1 /var', desc: '显示/var下一级子目录大小' },
      { cmd: 'du -ah /tmp | sort -rh | head -10', desc: '查找tmp下最大的10个文件' },
    ],
    tags: ['disk', 'usage', 'size'],
  },
  {
    name: 'lsusb',
    shortDesc: '列出USB设备信息',
    category: 'disk',
    syntax: 'lsusb [选项]',
    description: 'lsusb 命令用于显示系统中所有USB总线及连接的USB设备信息。',
    options: [
      { flag: '-v', desc: '显示详细信息' },
      { flag: '-t', desc: '以树状结构显示' },
      { flag: '-s', desc: '显示指定总线和设备' },
    ],
    examples: [
      { cmd: 'lsusb', desc: '列出所有USB设备' },
      { cmd: 'lsusb -v', desc: '显示USB设备详细信息' },
      { cmd: 'lsusb -t', desc: '以树状结构显示USB设备' },
    ],
    tags: ['disk', 'usb', 'device'],
  },
  {
    name: 'smartctl',
    shortDesc: '查看磁盘SMART健康信息',
    category: 'disk',
    syntax: 'smartctl [选项] 设备',
    description: 'smartctl 命令用于查看磁盘的SMART（自监测分析和报告技术）健康状态信息。',
    options: [
      { flag: '-a', desc: '显示所有SMART信息' },
      { flag: '-H', desc: '显示健康状态' },
      { flag: '-i', desc: '显示设备信息' },
      { flag: '-t', desc: '执行SMART测试' },
    ],
    examples: [
      { cmd: 'smartctl -a /dev/sda', desc: '显示磁盘所有SMART信息' },
      { cmd: 'smartctl -H /dev/sda', desc: '查看磁盘健康状态' },
      { cmd: 'smartctl -t short /dev/sda', desc: '执行短期SMART测试' },
    ],
    tags: ['disk', 'smart', 'health'],
  },
  {
    name: 'sync',
    shortDesc: '同步文件系统缓存',
    category: 'disk',
    syntax: 'sync [选项]',
    description: 'sync 命令用于将文件系统缓存中的数据刷新到磁盘，确保数据安全写入。',
    options: [],
    examples: [
      { cmd: 'sync', desc: '同步所有文件系统缓存到磁盘' },
    ],
    tags: ['disk', 'sync', 'cache'],
  },
  {
    name: 'eject',
    shortDesc: '弹出可移动介质',
    category: 'disk',
    syntax: 'eject [选项] [设备]',
    description: 'eject 命令用于弹出光盘、USB等可移动介质设备。',
    options: [
      { flag: '-t', desc: '关闭托盘' },
      { flag: '-T', desc: '切换托盘开关状态' },
      { flag: '-r', desc: '弹出光盘' },
    ],
    examples: [
      { cmd: 'eject /dev/sr0', desc: '弹出光盘' },
      { cmd: 'eject -t /dev/sr0', desc: '关闭光驱托盘' },
    ],
    tags: ['disk', 'eject', 'media'],
  },
  {
    name: 'fuser',
    shortDesc: '查看使用文件的进程',
    category: 'disk',
    syntax: 'fuser [选项] 文件|挂载点',
    description: 'fuser 命令用于查看哪些进程正在使用指定的文件、目录或套接字。',
    options: [
      { flag: '-v', desc: '详细模式' },
      { flag: '-k', desc: '终止使用该文件的进程' },
      { flag: '-m', desc: '查找使用该文件系统的进程' },
      { flag: '-n', desc: '指定命名空间' },
    ],
    examples: [
      { cmd: 'fuser -v /mnt/usb', desc: '查看使用该挂载点的进程' },
      { cmd: 'fuser -km /mnt/usb', desc: '终止占用挂载点的进程' },
      { cmd: 'fuser 80/tcp', desc: '查看占用80端口的进程' },
    ],
    tags: ['disk', 'process', 'file'],
  },

  // === 压缩减压 ===
  {
    name: 'tar',
    shortDesc: '打包和解包文件',
    category: 'compress',
    syntax: 'tar [选项] [文件名] [目录/文件]',
    description: 'tar 命令用于创建、提取或管理tar归档文件，常与gzip、bzip2等压缩工具配合使用。',
    options: [
      { flag: '-c', desc: '创建新归档' },
      { flag: '-x', desc: '提取归档' },
      { flag: '-t', desc: '列出归档内容' },
      { flag: '-z', desc: '使用gzip压缩/解压' },
      { flag: '-j', desc: '使用bzip2压缩/解压' },
      { flag: '-J', desc: '使用xz压缩/解压' },
      { flag: '-v', desc: '显示处理过程' },
      { flag: '-f', desc: '指定归档文件名' },
      { flag: '-C', desc: '指定解压目录' },
    ],
    examples: [
      { cmd: 'tar -czvf archive.tar.gz /path/to/dir', desc: '用gzip压缩打包目录' },
      { cmd: 'tar -xzvf archive.tar.gz', desc: '解压gzip格式的tar包' },
      { cmd: 'tar -cjvf archive.tar.bz2 /path/to/dir', desc: '用bzip2压缩打包目录' },
      { cmd: 'tar -tf archive.tar.gz', desc: '列出归档文件内容' },
    ],
    tags: ['compress', 'tar', 'archive'],
  },
  {
    name: 'gzip',
    shortDesc: '压缩文件（gzip格式）',
    category: 'compress',
    syntax: 'gzip [选项] 文件',
    description: 'gzip 命令用于压缩文件，压缩后原文件会被替换为.gz文件。',
    options: [
      { flag: '-d', desc: '解压文件' },
      { flag: '-k', desc: '保留原文件' },
      { flag: '-r', desc: '递归压缩目录' },
      { flag: '-n', desc: '指定压缩级别（1-9）' },
      { flag: '-l', desc: '列出压缩文件信息' },
    ],
    examples: [
      { cmd: 'gzip filename', desc: '压缩文件' },
      { cmd: 'gzip -k filename', desc: '压缩文件但保留原文件' },
      { cmd: 'gzip -r /path/to/dir', desc: '递归压缩目录中所有文件' },
      { cmd: 'gzip -l filename.gz', desc: '查看压缩文件信息' },
    ],
    tags: ['compress', 'gzip', 'gz'],
  },
  {
    name: 'gunzip',
    shortDesc: '解压gzip格式文件',
    category: 'compress',
    syntax: 'gunzip [选项] 文件.gz',
    description: 'gunzip 命令用于解压.gz格式的压缩文件，等同于 gzip -d。',
    options: [
      { flag: '-k', desc: '保留压缩文件' },
      { flag: '-r', desc: '递归解压' },
      { flag: '-f', desc: '强制解压' },
    ],
    examples: [
      { cmd: 'gunzip filename.gz', desc: '解压gzip文件' },
      { cmd: 'gunzip -k filename.gz', desc: '解压但保留压缩文件' },
    ],
    tags: ['compress', 'gunzip', 'decompress'],
  },
  {
    name: 'bzip2',
    shortDesc: '压缩文件（bzip2格式）',
    category: 'compress',
    syntax: 'bzip2 [选项] 文件',
    description: 'bzip2 命令用于压缩文件，通常比gzip压缩率更高但速度更慢，压缩后文件扩展名为.bz2。',
    options: [
      { flag: '-d', desc: '解压文件' },
      { flag: '-k', desc: '保留原文件' },
      { flag: '-z', desc: '强制压缩' },
      { flag: '-n', desc: '指定压缩级别（1-9）' },
    ],
    examples: [
      { cmd: 'bzip2 filename', desc: '压缩文件为bz2格式' },
      { cmd: 'bzip2 -k filename', desc: '压缩但保留原文件' },
      { cmd: 'bzip2 -9 filename', desc: '使用最高压缩率' },
    ],
    tags: ['compress', 'bzip2', 'bz2'],
  },
  {
    name: 'bunzip2',
    shortDesc: '解压bzip2格式文件',
    category: 'compress',
    syntax: 'bunzip2 [选项] 文件.bz2',
    description: 'bunzip2 命令用于解压.bz2格式的压缩文件，等同于 bzip2 -d。',
    options: [
      { flag: '-k', desc: '保留压缩文件' },
      { flag: '-f', desc: '强制解压' },
    ],
    examples: [
      { cmd: 'bunzip2 filename.bz2', desc: '解压bz2文件' },
      { cmd: 'bunzip2 -k filename.bz2', desc: '解压但保留压缩文件' },
    ],
    tags: ['compress', 'bunzip2', 'decompress'],
  },
  {
    name: 'xz',
    shortDesc: '压缩文件（xz格式）',
    category: 'compress',
    syntax: 'xz [选项] 文件',
    description: 'xz 命令用于压缩文件，压缩率通常比gzip和bzip2更高，但速度更慢。',
    options: [
      { flag: '-d', desc: '解压文件' },
      { flag: '-k', desc: '保留原文件' },
      { flag: '-l', desc: '列出压缩文件信息' },
      { flag: '-n', desc: '指定压缩级别（0-9）' },
      { flag: '-e', desc: '极限压缩模式' },
    ],
    examples: [
      { cmd: 'xz filename', desc: '压缩文件为xz格式' },
      { cmd: 'xz -k filename', desc: '压缩但保留原文件' },
      { cmd: 'xz -d filename.xz', desc: '解压xz文件' },
      { cmd: 'xz -9e filename', desc: '使用极限压缩率' },
    ],
    tags: ['compress', 'xz', 'lzma'],
  },
  {
    name: 'zip',
    shortDesc: '压缩文件为zip格式',
    category: 'compress',
    syntax: 'zip [选项] 压缩文件名 文件/目录',
    description: 'zip 命令用于将文件或目录压缩为.zip格式，是跨平台最常用的压缩格式之一。',
    options: [
      { flag: '-r', desc: '递归压缩目录' },
      { flag: '-e', desc: '创建加密压缩文件' },
      { flag: '-n', desc: '指定压缩级别（0-9）' },
      { flag: '-x', desc: '排除指定文件' },
      { flag: '-u', desc: '更新压缩文件中的内容' },
    ],
    examples: [
      { cmd: 'zip archive.zip file1 file2', desc: '压缩多个文件' },
      { cmd: 'zip -r archive.zip /path/to/dir', desc: '递归压缩目录' },
      { cmd: 'zip -re secret.zip /path/to/dir', desc: '创建加密的zip文件' },
    ],
    tags: ['compress', 'zip', 'archive'],
  },
  {
    name: 'unzip',
    shortDesc: '解压zip格式文件',
    category: 'compress',
    syntax: 'unzip [选项] 压缩文件 [-d 目录]',
    description: 'unzip 命令用于解压.zip格式的压缩文件。',
    options: [
      { flag: '-d', desc: '指定解压目录' },
      { flag: '-l', desc: '列出压缩文件内容' },
      { flag: '-o', desc: '覆盖已有文件' },
      { flag: '-q', desc: '安静模式' },
      { flag: '-x', desc: '排除指定文件' },
    ],
    examples: [
      { cmd: 'unzip archive.zip', desc: '解压到当前目录' },
      { cmd: 'unzip archive.zip -d /tmp', desc: '解压到指定目录' },
      { cmd: 'unzip -l archive.zip', desc: '列出压缩文件内容' },
    ],
    tags: ['compress', 'unzip', 'extract'],
  },
  {
    name: '7z',
    shortDesc: '7-Zip压缩解压工具',
    category: 'compress',
    syntax: '7z [命令] [选项] 压缩文件 [文件]',
    description: '7z 命令是7-Zip工具的命令行版本，支持7z、zip、gzip、bzip2等多种压缩格式。',
    options: [
      { flag: 'a', desc: '添加文件到压缩包' },
      { flag: 'x', desc: '解压文件（保留目录结构）' },
      { flag: 'e', desc: '解压文件（不保留目录结构）' },
      { flag: 'l', desc: '列出压缩包内容' },
      { flag: '-p', desc: '设置密码' },
    ],
    examples: [
      { cmd: '7z a archive.7z /path/to/dir', desc: '创建7z压缩包' },
      { cmd: '7z x archive.7z', desc: '解压7z压缩包' },
      { cmd: '7z a -psecret archive.7z file.txt', desc: '创建加密压缩包' },
      { cmd: '7z l archive.7z', desc: '列出压缩包内容' },
    ],
    tags: ['compress', '7z', '7zip'],
  },
  {
    name: 'zstd',
    shortDesc: 'Zstandard压缩解压工具',
    category: 'compress',
    syntax: 'zstd [选项] 文件',
    description: 'zstd 命令使用Zstandard算法压缩解压文件，兼具高压缩率和高速压缩的特点。',
    options: [
      { flag: '-d', desc: '解压文件' },
      { flag: '-k', desc: '保留原文件' },
      { flag: '-n', desc: '指定压缩级别（1-19）' },
      { flag: '-r', desc: '递归处理目录' },
      { flag: '-l', desc: '列出压缩文件信息' },
    ],
    examples: [
      { cmd: 'zstd filename', desc: '压缩文件为zst格式' },
      { cmd: 'zstd -d filename.zst', desc: '解压zst文件' },
      { cmd: 'zstd -19 filename', desc: '使用最高压缩率' },
      { cmd: 'zstd -r /path/to/dir -o archive.zst', desc: '递归压缩目录' },
    ],
    tags: ['compress', 'zstd', 'zstandard'],
  },
  {
    name: 'zcat',
    shortDesc: '查看gzip压缩文件内容',
    category: 'compress',
    syntax: 'zcat [选项] 文件.gz',
    description: 'zcat 命令用于在不解压的情况下查看gzip压缩文件的内容，等同于 gunzip -c。',
    options: [
      { flag: '-f', desc: '强制查看' },
      { flag: '-h', desc: '显示帮助信息' },
    ],
    examples: [
      { cmd: 'zcat file.gz', desc: '查看gzip文件内容' },
      { cmd: 'zcat file.gz | less', desc: '分页查看gzip文件内容' },
      { cmd: 'zcat file1.gz file2.gz', desc: '查看多个gzip文件内容' },
    ],
    tags: ['compress', 'zcat', 'view'],
  },
  {
    name: 'zgrep',
    shortDesc: '在gzip压缩文件中搜索',
    category: 'compress',
    syntax: 'zgrep [选项] 模式 文件.gz',
    description: 'zgrep 命令用于在不解压的情况下在gzip压缩文件中搜索匹配的文本行。',
    options: [
      { flag: '-i', desc: '忽略大小写' },
      { flag: '-n', desc: '显示行号' },
      { flag: '-c', desc: '只显示匹配行数' },
      { flag: '-r', desc: '递归搜索' },
    ],
    examples: [
      { cmd: 'zgrep "error" logfile.gz', desc: '在压缩日志中搜索error' },
      { cmd: 'zgrep -i "warning" logfile.gz', desc: '忽略大小写搜索warning' },
      { cmd: 'zgrep -c "failed" *.gz', desc: '统计每个文件中failed出现次数' },
    ],
    tags: ['compress', 'grep', 'search'],
  },

  // === 系统信息 ===
  {
    name: 'uname',
    shortDesc: '显示系统信息',
    category: 'system',
    syntax: 'uname [选项]',
    description: '显示当前操作系统内核名称、版本、架构等系统信息。',
    options: [
      { flag: '-a', desc: '显示所有系统信息' },
      { flag: '-r', desc: '显示内核版本' },
      { flag: '-m', desc: '显示硬件架构' },
    ],
    examples: [
      { cmd: 'uname -a', desc: '查看完整系统信息' },
      { cmd: 'uname -r', desc: '查看内核版本' },
    ],
    tags: ['kernel', 'system', 'version'],
  },
  {
    name: 'uptime',
    shortDesc: '查看运行时长',
    category: 'system',
    syntax: 'uptime [选项]',
    description: '显示系统运行时间、当前登录用户数和系统负载。',
    options: [
      { flag: '-p', desc: '以人类可读格式显示运行时间' },
      { flag: '-s', desc: '显示系统启动时间' },
    ],
    examples: [
      { cmd: 'uptime', desc: '查看系统运行时间和负载' },
      { cmd: 'uptime -p', desc: '以可读格式显示运行时长' },
    ],
    tags: ['uptime', 'load', 'runtime'],
  },
  {
    name: 'hostname',
    shortDesc: '查看或设置主机名',
    category: 'system',
    syntax: 'hostname [选项]',
    description: '显示或临时设置系统的主机名。永久修改需编辑配置文件。',
    options: [
      { flag: '-I', desc: '显示所有网络地址' },
      { flag: '-d', desc: '显示DNS域名' },
    ],
    examples: [
      { cmd: 'hostname', desc: '查看当前主机名' },
      { cmd: 'hostname -I', desc: '查看本机IP地址' },
    ],
    tags: ['hostname', 'network', 'name'],
  },
  {
    name: 'hostnamectl',
    shortDesc: '管理主机名设置',
    category: 'system',
    syntax: 'hostnamectl [命令]',
    description: 'systemd 提供的主机名管理工具，可永久修改主机名。',
    options: [
      { flag: 'set-hostname', desc: '设置主机名' },
      { flag: 'status', desc: '显示当前主机信息' },
    ],
    examples: [
      { cmd: 'hostnamectl status', desc: '查看主机详细信息' },
      { cmd: 'sudo hostnamectl set-hostname myserver', desc: '永久设置主机名' },
    ],
    tags: ['hostname', 'systemd', 'set'],
  },
  {
    name: 'date',
    shortDesc: '显示或设置日期',
    category: 'system',
    syntax: 'date [选项] [格式]',
    description: '显示或设置系统日期和时间。支持自定义输出格式。',
    options: [
      { flag: '+%Y-%m-%d', desc: '按指定格式输出日期' },
      { flag: '-s', desc: '设置系统时间' },
      { flag: '-d', desc: '显示指定日期' },
    ],
    examples: [
      { cmd: 'date "+%Y-%m-%d %H:%M:%S"', desc: '格式化输出当前时间' },
      { cmd: 'date -d "next Friday"', desc: '显示下周五的日期' },
    ],
    tags: ['date', 'time', 'format'],
  },
  {
    name: 'cal',
    shortDesc: '显示日历',
    category: 'system',
    syntax: 'cal [选项] [月份] [年份]',
    description: '在终端中以文本形式显示日历。',
    options: [
      { flag: '-3', desc: '显示上月、当月、下月' },
      { flag: '-y', desc: '显示全年日历' },
    ],
    examples: [
      { cmd: 'cal', desc: '显示当月日历' },
      { cmd: 'cal 2025', desc: '显示2025年日历' },
    ],
    tags: ['calendar', 'date', 'month'],
  },
  {
    name: 'free',
    shortDesc: '查看内存使用',
    category: 'system',
    syntax: 'free [选项]',
    description: '显示系统物理内存和交换分区的使用情况。',
    options: [
      { flag: '-h', desc: '人类可读格式' },
      { flag: '-s', desc: '持续刷新（秒）' },
    ],
    examples: [
      { cmd: 'free -h', desc: '以人类可读格式显示内存' },
      { cmd: 'free -s 2', desc: '每2秒刷新一次' },
    ],
    tags: ['memory', 'ram', 'usage'],
  },
  {
    name: 'lsb_release',
    shortDesc: '查看发行版信息',
    category: 'system',
    syntax: 'lsb_release [选项]',
    description: '显示 Linux 发行版信息，如发行版本和代号。',
    options: [
      { flag: '-a', desc: '显示所有信息' },
      { flag: '-d', desc: '显示发行版描述' },
    ],
    examples: [
      { cmd: 'lsb_release -a', desc: '查看完整发行版信息' },
    ],
    tags: ['distro', 'release', 'version'],
  },
  {
    name: 'dmesg',
    shortDesc: '查看内核日志',
    category: 'system',
    syntax: 'dmesg [选项]',
    description: '显示内核环形缓冲区中的消息，用于排查硬件和驱动问题。',
    options: [
      { flag: '-T', desc: '显示时间戳' },
      { flag: '-l', desc: '按日志级别过滤' },
    ],
    examples: [
      { cmd: 'dmesg | tail -20', desc: '查看最近20条内核消息' },
      { cmd: 'dmesg -T -l err,warn', desc: '仅显示错误和警告' },
    ],
    tags: ['kernel', 'log', 'boot'],
  },
  {
    name: 'env',
    shortDesc: '查看环境变量',
    category: 'system',
    syntax: 'env [选项]',
    description: '显示当前用户的所有环境变量。',
    options: [
      { flag: '-i', desc: '清空环境变量执行命令' },
    ],
    examples: [
      { cmd: 'env', desc: '列出所有环境变量' },
      { cmd: 'env | grep PATH', desc: '查找PATH相关变量' },
    ],
    tags: ['environment', 'variable', 'export'],
  },
  {
    name: 'export',
    shortDesc: '设置环境变量',
    category: 'system',
    syntax: 'export 变量=值',
    description: '设置或导出 Shell 环境变量，使其在子进程中可用。',
    options: [
      { flag: '-n', desc: '移除导出标记' },
      { flag: '-p', desc: '列出所有导出变量' },
    ],
    examples: [
      { cmd: 'export PATH=$PATH:/new/path', desc: '追加PATH路径' },
      { cmd: 'export MY_VAR="hello"', desc: '设置自定义变量' },
    ],
    tags: ['environment', 'variable', 'shell'],
  },
  {
    name: 'history',
    shortDesc: '查看命令历史',
    category: 'system',
    syntax: 'history [选项]',
    description: '显示用户执行过的命令历史记录。',
    options: [
      { flag: '-c', desc: '清空历史记录' },
      { flag: '-d', desc: '删除指定编号的记录' },
    ],
    examples: [
      { cmd: 'history | tail -20', desc: '查看最近20条命令' },
      { cmd: 'history -c', desc: '清空所有历史记录' },
    ],
    tags: ['history', 'command', 'record'],
  },
  {
    name: 'alias',
    shortDesc: '设置命令别名',
    category: 'system',
    syntax: 'alias 别名=命令',
    description: '为常用命令创建简短的别名，提高操作效率。',
    options: [
      { flag: '-p', desc: '列出所有别名' },
    ],
    examples: [
      { cmd: 'alias ll="ls -la"', desc: '设置 ll 别名' },
      { cmd: 'alias', desc: '列出所有别名' },
    ],
    tags: ['alias', 'shortcut', 'shell'],
  },
  {
    name: 'type',
    shortDesc: '查看命令类型',
    category: 'system',
    syntax: 'type [选项] 命令名',
    description: '显示命令是内置命令、别名还是外部程序。',
    options: [
      { flag: '-a', desc: '显示所有匹配位置' },
      { flag: '-t', desc: '仅显示类型' },
    ],
    examples: [
      { cmd: 'type cd', desc: '查看cd是内置还是外部命令' },
      { cmd: 'type -a python', desc: '查找python所有位置' },
    ],
    tags: ['type', 'builtin', 'command'],
  },
  {
    name: 'lscpu',
    shortDesc: '查看CPU信息',
    category: 'system',
    syntax: 'lscpu [选项]',
    description: '显示 CPU 架构、核心数、频率等详细信息。',
    options: [
      { flag: '-e', desc: '以列表显示每个CPU' },
    ],
    examples: [
      { cmd: 'lscpu', desc: '查看CPU详细信息' },
      { cmd: 'lscpu | grep "Model name"', desc: '仅查看CPU型号' },
    ],
    tags: ['cpu', 'processor', 'hardware'],
  },
  {
    name: 'lspci',
    shortDesc: '查看PCI设备',
    category: 'system',
    syntax: 'lspci [选项]',
    description: '列出所有 PCI 总线上的设备信息。',
    options: [
      { flag: '-v', desc: '显示详细信息' },
      { flag: '-nn', desc: '显示设备ID' },
    ],
    examples: [
      { cmd: 'lspci', desc: '列出所有PCI设备' },
      { cmd: 'lspci | grep -i vga', desc: '查找显卡设备' },
    ],
    tags: ['pci', 'hardware', 'device'],
  },
  {
    name: 'dmidecode',
    shortDesc: '查看硬件信息',
    category: 'system',
    syntax: 'sudo dmidecode [选项]',
    description: '读取 DMI/SMBIOS 数据，显示主板、BIOS、内存等硬件详情。',
    options: [
      { flag: '-t', desc: '按类型过滤' },
      { flag: '-q', desc: '精简输出' },
    ],
    examples: [
      { cmd: 'sudo dmidecode -t memory', desc: '查看内存详细信息' },
      { cmd: 'sudo dmidecode -t system', desc: '查看系统信息' },
    ],
    tags: ['bios', 'hardware', 'dmi'],
  },
  {
    name: 'vmstat',
    shortDesc: '查看虚拟内存统计',
    category: 'system',
    syntax: 'vmstat [选项] [间隔] [次数]',
    description: '报告虚拟内存、进程、CPU活动等系统统计信息。',
    options: [
      { flag: '-s', desc: '显示事件计数器' },
      { flag: '-a', desc: '显示活跃/非活跃内存' },
    ],
    examples: [
      { cmd: 'vmstat 1 5', desc: '每秒采样一次，共5次' },
      { cmd: 'vmstat -s', desc: '显示内存统计汇总' },
    ],
    tags: ['vm', 'memory', 'statistics'],
  },
  {
    name: 'iostat',
    shortDesc: '查看IO统计',
    category: 'system',
    syntax: 'iostat [选项] [间隔]',
    description: '报告 CPU 和 I/O 设备的使用统计。',
    options: [
      { flag: '-x', desc: '显示扩展统计' },
      { flag: '-c', desc: '仅显示CPU统计' },
    ],
    examples: [
      { cmd: 'iostat -x 1', desc: '每秒显示扩展IO统计' },
    ],
    tags: ['io', 'disk', 'statistics'],
  },

  // === 包管理 ===
  {
    name: 'apt',
    shortDesc: 'Debian包管理',
    category: 'package',
    syntax: 'apt [命令] [包名]',
    description: 'Debian/Ubuntu 系统的高级包管理工具，用于安装、更新和删除软件包。',
    options: [
      { flag: 'install', desc: '安装包' },
      { flag: 'remove', desc: '删除包' },
      { flag: 'update', desc: '更新包索引' },
      { flag: 'upgrade', desc: '升级已安装的包' },
    ],
    examples: [
      { cmd: 'sudo apt update', desc: '更新软件源索引' },
      { cmd: 'sudo apt install nginx', desc: '安装nginx' },
      { cmd: 'sudo apt upgrade', desc: '升级所有可更新的包' },
    ],
    tags: ['debian', 'ubuntu', 'install'],
  },
  {
    name: 'apt-get',
    shortDesc: 'APT包管理(底层)',
    category: 'package',
    syntax: 'apt-get [命令] [包名]',
    description: 'APT 的底层包管理命令，功能与 apt 类似但更多用于脚本。',
    options: [
      { flag: 'autoremove', desc: '删除不再需要的依赖' },
      { flag: 'purge', desc: '删除包及配置文件' },
    ],
    examples: [
      { cmd: 'sudo apt-get autoremove', desc: '清理无用依赖' },
      { cmd: 'sudo apt-get purge apache2', desc: '彻底删除包和配置' },
    ],
    tags: ['debian', 'ubuntu', 'package'],
  },
  {
    name: 'dpkg',
    shortDesc: 'Debian包操作',
    category: 'package',
    syntax: 'dpkg [选项] 包文件',
    description: 'Debian 底层包管理工具，直接操作 .deb 包文件。',
    options: [
      { flag: '-i', desc: '安装deb包' },
      { flag: '-l', desc: '列出已安装的包' },
      { flag: '-r', desc: '删除包' },
    ],
    examples: [
      { cmd: 'sudo dpkg -i package.deb', desc: '安装本地deb包' },
      { cmd: 'dpkg -l | grep nginx', desc: '检查包是否已安装' },
    ],
    tags: ['debian', 'deb', 'package'],
  },
  {
    name: 'yum',
    shortDesc: 'RHEL包管理',
    category: 'package',
    syntax: 'yum [命令] [包名]',
    description: 'CentOS/RHEL 7 及更早版本的包管理工具。',
    options: [
      { flag: 'install', desc: '安装包' },
      { flag: 'remove', desc: '删除包' },
      { flag: 'makecache', desc: '创建包缓存' },
    ],
    examples: [
      { cmd: 'sudo yum install vim', desc: '安装vim' },
      { cmd: 'yum search httpd', desc: '搜索包' },
    ],
    tags: ['centos', 'rhel', 'rpm'],
  },
  {
    name: 'dnf',
    shortDesc: 'Fedora包管理',
    category: 'package',
    syntax: 'dnf [命令] [包名]',
    description: 'yum 的下一代替代品，用于 Fedora 和 RHEL 8+。',
    options: [
      { flag: 'install', desc: '安装包' },
      { flag: 'autoremove', desc: '删除无用依赖' },
    ],
    examples: [
      { cmd: 'sudo dnf install htop', desc: '安装htop' },
      { cmd: 'dnf list updates', desc: '查看可更新的包' },
    ],
    tags: ['fedora', 'rhel', 'package'],
  },
  {
    name: 'rpm',
    shortDesc: 'RPM包操作',
    category: 'package',
    syntax: 'rpm [选项] 包文件',
    description: 'Red Hat 系统的底层包管理工具，直接操作 .rpm 文件。',
    options: [
      { flag: '-ivh', desc: '安装并显示进度' },
      { flag: '-qa', desc: '列出所有已安装的包' },
      { flag: '-e', desc: '删除包' },
    ],
    examples: [
      { cmd: 'sudo rpm -ivh package.rpm', desc: '安装rpm包' },
      { cmd: 'rpm -qa | grep mysql', desc: '查找已安装的mysql包' },
    ],
    tags: ['rpm', 'redhat', 'package'],
  },
  {
    name: 'pacman',
    shortDesc: 'Arch包管理',
    category: 'package',
    syntax: 'pacman [选项] [包名]',
    description: 'Arch Linux 的包管理工具，以简洁高效著称。',
    options: [
      { flag: '-S', desc: '安装包（同步）' },
      { flag: '-R', desc: '删除包' },
      { flag: '-Syu', desc: '更新所有包' },
    ],
    examples: [
      { cmd: 'sudo pacman -Syu', desc: '更新整个系统' },
      { cmd: 'sudo pacman -S vim', desc: '安装vim' },
    ],
    tags: ['arch', 'manjaro', 'package'],
  },
  {
    name: 'snap',
    shortDesc: 'Snap包管理',
    category: 'package',
    syntax: 'snap [命令] [包名]',
    description: 'Canonical 开发的通用包管理工具，支持沙箱隔离运行。',
    options: [
      { flag: 'install', desc: '安装snap包' },
      { flag: 'list', desc: '列出已安装的snap' },
    ],
    examples: [
      { cmd: 'sudo snap install vlc', desc: '安装VLC播放器' },
      { cmd: 'snap list', desc: '列出所有snap应用' },
    ],
    tags: ['snap', 'canonical', 'universal'],
  },
  {
    name: 'flatpak',
    shortDesc: 'Flatpak包管理',
    category: 'package',
    syntax: 'flatpak [命令] [包名]',
    description: 'Linux 桌面应用的通用打包和分发框架。',
    options: [
      { flag: 'install', desc: '安装flatpak应用' },
      { flag: 'update', desc: '更新应用' },
    ],
    examples: [
      { cmd: 'flatpak install flathub org.gimp.GIMP', desc: '安装GIMP' },
      { cmd: 'flatpak list', desc: '列出已安装应用' },
    ],
    tags: ['flatpak', 'flathub', 'sandbox'],
  },
  {
    name: 'pip',
    shortDesc: 'Python包管理',
    category: 'package',
    syntax: 'pip [命令] [包名]',
    description: 'Python 的包管理工具，从 PyPI 安装和管理 Python 包。',
    options: [
      { flag: 'install', desc: '安装包' },
      { flag: 'uninstall', desc: '卸载包' },
      { flag: 'list', desc: '列出已安装的包' },
    ],
    examples: [
      { cmd: 'pip install requests', desc: '安装requests库' },
      { cmd: 'pip list --outdated', desc: '查看可更新的包' },
    ],
    tags: ['python', 'pypi', 'package'],
  },
  {
    name: 'npm',
    shortDesc: 'Node.js包管理',
    category: 'package',
    syntax: 'npm [命令] [包名]',
    description: 'Node.js 的默认包管理工具，管理 JavaScript 依赖。',
    options: [
      { flag: 'install', desc: '安装依赖' },
      { flag: 'run', desc: '运行脚本' },
      { flag: 'init', desc: '初始化项目' },
    ],
    examples: [
      { cmd: 'npm install express', desc: '安装express框架' },
      { cmd: 'npm run build', desc: '运行构建脚本' },
    ],
    tags: ['node', 'javascript', 'package'],
  },
  {
    name: 'yarn',
    shortDesc: '快速JS包管理',
    category: 'package',
    syntax: 'yarn [命令] [包名]',
    description: 'Facebook 开发的快速 JavaScript 包管理工具，兼容 npm。',
    options: [
      { flag: 'add', desc: '添加依赖' },
      { flag: 'upgrade', desc: '升级依赖' },
    ],
    examples: [
      { cmd: 'yarn add react', desc: '添加React依赖' },
      { cmd: 'yarn install', desc: '安装所有依赖' },
    ],
    tags: ['yarn', 'javascript', 'fast'],
  },
  {
    name: 'cargo',
    shortDesc: 'Rust包管理',
    category: 'package',
    syntax: 'cargo [命令]',
    description: 'Rust 语言的包管理器和构建工具。',
    options: [
      { flag: 'build', desc: '编译项目' },
      { flag: 'run', desc: '编译并运行' },
      { flag: 'install', desc: '安装二进制包' },
    ],
    examples: [
      { cmd: 'cargo new myproject', desc: '创建新Rust项目' },
      { cmd: 'cargo build --release', desc: '发布模式编译' },
    ],
    tags: ['rust', 'crates', 'build'],
  },

  // === 日志调试 ===
  {
    name: 'journalctl',
    shortDesc: '查看系统日志',
    category: 'debug',
    syntax: 'journalctl [选项]',
    description: '查询 systemd 日志系统的日志信息，支持按时间、服务、优先级过滤。',
    options: [
      { flag: '-u', desc: '按服务单元过滤' },
      { flag: '-f', desc: '实时跟踪日志' },
      { flag: '--since', desc: '按起始时间过滤' },
    ],
    examples: [
      { cmd: 'journalctl -u nginx -f', desc: '实时查看nginx日志' },
      { cmd: 'journalctl --since "1 hour ago"', desc: '查看最近1小时日志' },
    ],
    tags: ['journal', 'systemd', 'log'],
  },
  {
    name: 'logrotate',
    shortDesc: '日志轮转管理',
    category: 'debug',
    syntax: 'logrotate [选项] 配置文件',
    description: '自动压缩、轮转和删除旧日志文件的管理工具。',
    options: [
      { flag: '-d', desc: '调试模式（不实际操作）' },
      { flag: '-f', desc: '强制轮转' },
    ],
    examples: [
      { cmd: 'logrotate -d /etc/logrotate.conf', desc: '调试模式测试配置' },
      { cmd: 'logrotate -f /etc/logrotate.d/nginx', desc: '强制轮转nginx日志' },
    ],
    tags: ['log', 'rotate', 'compress'],
  },
  {
    name: 'logger',
    shortDesc: '写入系统日志',
    category: 'debug',
    syntax: 'logger [选项] 消息',
    description: '向系统日志写入自定义消息，常用于脚本调试。',
    options: [
      { flag: '-t', desc: '添加标签' },
      { flag: '-p', desc: '指定优先级' },
    ],
    examples: [
      { cmd: 'logger -t myscript "Task completed"', desc: '写入带标签的日志' },
      { cmd: 'logger -p user.warning "Low disk space"', desc: '写入警告级别日志' },
    ],
    tags: ['log', 'syslog', 'write'],
  },
  {
    name: 'strace',
    shortDesc: '追踪系统调用',
    category: 'debug',
    syntax: 'strace [选项] 命令',
    description: '追踪程序执行时的系统调用和信号，是调试程序的利器。',
    options: [
      { flag: '-p', desc: '追踪指定PID' },
      { flag: '-e', desc: '过滤系统调用类型' },
      { flag: '-o', desc: '输出到文件' },
    ],
    examples: [
      { cmd: 'strace ls 2>&1 | grep open', desc: '追踪ls打开的文件' },
      { cmd: 'strace -p 1234', desc: '追踪正在运行的进程' },
    ],
    tags: ['trace', 'syscall', 'debug'],
  },
  {
    name: 'ltrace',
    shortDesc: '追踪库函数调用',
    category: 'debug',
    syntax: 'ltrace [选项] 命令',
    description: '追踪程序调用的动态链接库函数，类似 strace 但针对库调用。',
    options: [
      { flag: '-p', desc: '追踪指定PID' },
      { flag: '-e', desc: '过滤函数名' },
    ],
    examples: [
      { cmd: 'ltrace ls 2>&1 | head', desc: '追踪ls的库函数调用' },
    ],
    tags: ['trace', 'library', 'debug'],
  },
  {
    name: 'gdb',
    shortDesc: 'GNU调试器',
    category: 'debug',
    syntax: 'gdb [选项] 程序',
    description: 'GNU 调试器，用于调试 C/C++ 等编译型程序。',
    options: [
      { flag: '-p', desc: '附加到运行中的进程' },
      { flag: '-tui', desc: '启用文本UI界面' },
    ],
    examples: [
      { cmd: 'gdb ./myprogram', desc: '启动调试会话' },
      { cmd: 'gdb -p 1234', desc: '附加到PID为1234的进程' },
    ],
    tags: ['debug', 'gdb', 'breakpoint'],
  },
  {
    name: 'valgrind',
    shortDesc: '内存泄漏检测',
    category: 'debug',
    syntax: 'valgrind [选项] 程序',
    description: '检测程序的内存泄漏、越界访问等内存相关问题。',
    options: [
      { flag: '--leak-check', desc: '设置内存泄漏检查级别' },
      { flag: '--show-reachable', desc: '显示可达的内存块' },
    ],
    examples: [
      { cmd: 'valgrind --leak-check=full ./myprogram', desc: '完整内存泄漏检查' },
    ],
    tags: ['valgrind', 'memory', 'leak'],
  },

  // === Shell 编程 ===
  {
    name: 'source',
    shortDesc: '执行脚本文件',
    category: 'shell',
    syntax: 'source 文件',
    description: '在当前 Shell 环境中执行脚本，脚本中的变量和函数在当前 Shell 可用。',
    options: [],
    examples: [
      { cmd: 'source ~/.bashrc', desc: '重新加载bash配置' },
      { cmd: 'source env.sh', desc: '加载环境变量' },
    ],
    tags: ['source', 'dot', 'script'],
  },
  {
    name: 'read',
    shortDesc: '读取用户输入',
    category: 'shell',
    syntax: 'read [选项] 变量名',
    description: '从标准输入读取一行数据赋值给变量。',
    options: [
      { flag: '-p', desc: '设置提示文字' },
      { flag: '-s', desc: '静默模式（不显示输入）' },
      { flag: '-t', desc: '设置超时时间' },
    ],
    examples: [
      { cmd: 'read -p "请输入姓名: " name', desc: '带提示的输入' },
      { cmd: 'read -s -p "密码: " pass', desc: '静默输入密码' },
    ],
    tags: ['read', 'input', 'prompt'],
  },
  {
    name: 'test',
    shortDesc: '条件测试',
    category: 'shell',
    syntax: 'test 表达式',
    description: '评估条件表达式，返回 0（真）或 1（假）。常用 [ ] 语法替代。',
    options: [
      { flag: '-f', desc: '文件存在且为普通文件' },
      { flag: '-d', desc: '文件存在且为目录' },
      { flag: '-z', desc: '字符串为空' },
    ],
    examples: [
      { cmd: '[ -f /etc/passwd ] && echo "exists"', desc: '检查文件是否存在' },
      { cmd: '[ -z "$VAR" ] && echo "empty"', desc: '检查变量是否为空' },
    ],
    tags: ['test', 'condition', 'bracket'],
  },
  {
    name: 'expr',
    shortDesc: '表达式求值',
    category: 'shell',
    syntax: 'expr 表达式',
    description: '计算整数表达式或操作字符串。',
    options: [],
    examples: [
      { cmd: 'expr 5 + 3', desc: '加法运算' },
      { cmd: 'expr length "hello"', desc: '计算字符串长度' },
    ],
    tags: ['expression', 'calculate', 'math'],
  },
  {
    name: 'let',
    shortDesc: '整数运算',
    category: 'shell',
    syntax: 'let 变量=表达式',
    description: 'Shell 内置的整数运算命令。',
    options: [],
    examples: [
      { cmd: 'let x=5+3 && echo $x', desc: '计算并输出结果' },
      { cmd: 'let i++', desc: '自增运算' },
    ],
    tags: ['let', 'math', 'integer'],
  },
  {
    name: 'declare',
    shortDesc: '声明变量类型',
    category: 'shell',
    syntax: 'declare [选项] 变量=值',
    description: '声明变量并设置类型属性，如整数、只读、数组等。',
    options: [
      { flag: '-i', desc: '声明为整数' },
      { flag: '-r', desc: '声明为只读' },
      { flag: '-a', desc: '声明为数组' },
    ],
    examples: [
      { cmd: 'declare -i num=42', desc: '声明整数变量' },
      { cmd: 'declare -r PI=3.14', desc: '声明只读常量' },
    ],
    tags: ['declare', 'variable', 'type'],
  },
  {
    name: 'local',
    shortDesc: '声明局部变量',
    category: 'shell',
    syntax: 'local 变量=值',
    description: '在函数内声明局部变量，作用域仅限当前函数。',
    options: [],
    examples: [
      { cmd: 'local count=0', desc: '在函数内声明局部变量' },
    ],
    tags: ['local', 'variable', 'function'],
  },
  {
    name: 'shift',
    shortDesc: '移动位置参数',
    category: 'shell',
    syntax: 'shift [n]',
    description: '将位置参数左移 n 位，$2 变为 $1，$3 变为 $2，以此类推。',
    options: [],
    examples: [
      { cmd: 'shift 2', desc: '左移2个位置参数' },
    ],
    tags: ['shift', 'parameter', 'argument'],
  },
  {
    name: 'getopts',
    shortDesc: '解析脚本选项',
    category: 'shell',
    syntax: 'getopts 选项字符串 变量名',
    description: 'Shell 内置的命令行选项解析工具。',
    options: [],
    examples: [
      { cmd: "while getopts 'a:b' opt; do case $opt in a) echo $OPTARG;; b) echo 'flag b';; esac; done", desc: '解析 -a 和 -b 选项' },
    ],
    tags: ['getopts', 'option', 'parse'],
  },
  {
    name: 'eval',
    shortDesc: '二次解析执行',
    category: 'shell',
    syntax: 'eval 命令',
    description: '对参数进行二次 Shell 解析后执行，常用于动态构建命令。',
    options: [],
    examples: [
      { cmd: 'eval "echo \\$HOME"', desc: '二次解析后执行' },
    ],
    tags: ['eval', 'parse', 'dynamic'],
  },
  {
    name: 'exec',
    shortDesc: '替换当前进程',
    category: 'shell',
    syntax: 'exec [命令]',
    description: '用指定命令替换当前 Shell 进程，或重定向文件描述符。',
    options: [],
    examples: [
      { cmd: 'exec > output.log', desc: '将所有输出重定向到文件' },
      { cmd: 'exec /bin/bash', desc: '替换为新的bash进程' },
    ],
    tags: ['exec', 'replace', 'redirect'],
  },
  {
    name: 'trap',
    shortDesc: '捕获信号',
    category: 'shell',
    syntax: 'trap 命令 信号',
    description: '捕获 Shell 收到的信号并执行指定操作，如清理临时文件。',
    options: [],
    examples: [
      { cmd: 'trap "rm -f /tmp/mylock; exit" EXIT INT TERM', desc: '退出时清理临时文件' },
    ],
    tags: ['trap', 'signal', 'cleanup'],
  },
  {
    name: 'wait',
    shortDesc: '等待后台进程',
    category: 'shell',
    syntax: 'wait [PID]',
    description: '等待后台进程完成后再继续执行。',
    options: [],
    examples: [
      { cmd: 'sleep 10 & wait $!', desc: '等待后台任务完成' },
    ],
    tags: ['wait', 'background', 'process'],
  },
  {
    name: 'sleep',
    shortDesc: '暂停执行',
    category: 'shell',
    syntax: 'sleep 秒数',
    description: '暂停脚本执行指定的秒数。',
    options: [],
    examples: [
      { cmd: 'sleep 5', desc: '暂停5秒' },
      { cmd: 'sleep 0.5', desc: '暂停0.5秒' },
    ],
    tags: ['sleep', 'delay', 'pause'],
  },
  {
    name: 'exit',
    shortDesc: '退出脚本',
    category: 'shell',
    syntax: 'exit [状态码]',
    description: '退出当前 Shell 或脚本，可指定退出状态码。0 表示成功。',
    options: [],
    examples: [
      { cmd: 'exit 0', desc: '以成功状态退出' },
      { cmd: 'exit 1', desc: '以错误状态退出' },
    ],
    tags: ['exit', 'status', 'code'],
  },
  {
    name: 'return',
    shortDesc: '函数返回值',
    category: 'shell',
    syntax: 'return [状态码]',
    description: '从函数中返回指定状态码。',
    options: [],
    examples: [
      { cmd: 'return 0', desc: '函数成功返回' },
    ],
    tags: ['return', 'function', 'status'],
  },
  {
    name: 'set',
    shortDesc: '设置Shell选项',
    category: 'shell',
    syntax: 'set [选项]',
    description: '设置或取消 Shell 行为选项，如调试模式、错误处理等。',
    options: [
      { flag: '-e', desc: '命令失败时立即退出' },
      { flag: '-x', desc: '打印执行的每条命令' },
      { flag: '-u', desc: '引用未定义变量时报错' },
    ],
    examples: [
      { cmd: 'set -euxo pipefail', desc: '脚本严格模式（推荐）' },
    ],
    tags: ['set', 'option', 'shell'],
  },

  // === 性能监控 ===
  {
    name: 'iotop',
    shortDesc: '监控磁盘IO',
    category: 'perf',
    syntax: 'sudo iotop [选项]',
    description: '实时监控各进程的磁盘 I/O 使用情况。',
    options: [
      { flag: '-o', desc: '仅显示有IO的进程' },
      { flag: '-P', desc: '按进程而非线程显示' },
    ],
    examples: [
      { cmd: 'sudo iotop -oP', desc: '显示有IO活动的进程' },
    ],
    tags: ['io', 'disk', 'monitor'],
  },
  {
    name: 'nethogs',
    shortDesc: '监控网络带宽',
    category: 'perf',
    syntax: 'sudo nethogs [选项]',
    description: '按进程显示网络带宽使用情况。',
    options: [
      { flag: '-d', desc: '设置刷新间隔（秒）' },
    ],
    examples: [
      { cmd: 'sudo nethogs', desc: '查看各进程网络占用' },
    ],
    tags: ['network', 'bandwidth', 'per-process'],
  },
  {
    name: 'nload',
    shortDesc: '监控网络流量',
    category: 'perf',
    syntax: 'nload [选项]',
    description: '实时显示网络接口的进出流量统计图表。',
    options: [],
    examples: [
      { cmd: 'nload', desc: '查看网络流量图' },
    ],
    tags: ['network', 'traffic', 'graph'],
  },
  {
    name: 'iftop',
    shortDesc: '监控网络连接',
    category: 'perf',
    syntax: 'sudo iftop [选项]',
    description: '实时显示网络接口上的连接及其带宽使用。',
    options: [
      { flag: '-i', desc: '指定网络接口' },
      { flag: '-n', desc: '不解析主机名' },
    ],
    examples: [
      { cmd: 'sudo iftop -i eth0', desc: '监控eth0接口流量' },
    ],
    tags: ['network', 'bandwidth', 'connection'],
  },
  {
    name: 'glances',
    shortDesc: '全能系统监控',
    category: 'perf',
    syntax: 'glances [选项]',
    description: '综合系统监控工具，显示 CPU、内存、磁盘、网络等信息。',
    options: [
      { flag: '-w', desc: 'Web界面模式' },
      { flag: '-t', desc: '设置刷新间隔' },
    ],
    examples: [
      { cmd: 'glances', desc: '启动综合监控' },
      { cmd: 'glances -w', desc: '以Web模式运行' },
    ],
    tags: ['monitor', 'system', 'overview'],
  },
  {
    name: 'btop',
    shortDesc: '美化的系统监控',
    category: 'perf',
    syntax: 'btop [选项]',
    description: '现代化美观的系统资源监控工具，是 bpytop 的 C++ 版本。',
    options: [],
    examples: [
      { cmd: 'btop', desc: '启动美化监控界面' },
    ],
    tags: ['monitor', 'beautiful', 'modern'],
  },
  {
    name: 'nvtop',
    shortDesc: '监控GPU使用',
    category: 'perf',
    syntax: 'nvtop [选项]',
    description: '类似 htop 的 GPU 监控工具，支持 NVIDIA/AMD GPU。',
    options: [],
    examples: [
      { cmd: 'nvtop', desc: '实时监控GPU使用情况' },
    ],
    tags: ['gpu', 'nvidia', 'monitor'],
  },
  {
    name: 'sar',
    shortDesc: '系统活动报告',
    category: 'perf',
    syntax: 'sar [选项] [间隔]',
    description: '收集和报告系统活动信息，如 CPU、内存、IO、网络等。',
    options: [
      { flag: '-u', desc: 'CPU使用率' },
      { flag: '-r', desc: '内存使用' },
      { flag: '-n', desc: '网络统计' },
    ],
    examples: [
      { cmd: 'sar -u 1 5', desc: '每秒采样CPU共5次' },
      { cmd: 'sar -r', desc: '查看内存使用历史' },
    ],
    tags: ['sysstat', 'report', 'history'],
  },
  {
    name: 'perf',
    shortDesc: '性能分析工具',
    category: 'perf',
    syntax: 'perf [子命令] [选项]',
    description: 'Linux 内核性能分析工具，可统计硬件事件、函数调用等。',
    options: [
      { flag: 'stat', desc: '统计性能事件' },
      { flag: 'record', desc: '采样记录' },
      { flag: 'report', desc: '分析报告' },
    ],
    examples: [
      { cmd: 'perf stat ls', desc: '统计ls命令的性能事件' },
      { cmd: 'sudo perf record -g ./myapp', desc: '采样记录程序运行' },
    ],
    tags: ['perf', 'profiling', 'analysis'],
  },
]

// ====== State ======
const selectedCategory = ref('all')
const selectedCommand = ref<LinuxCommand | null>(null)
const searchText = ref('')
const copiedId = ref('')
const favorites = ref<Set<string>>(new Set())
const showFavoritesOnly = ref(false)
const customCommands = ref<LinuxCommand[]>([])
const configPath = ref('')
const showImportPanel = ref(false)
const importText = ref('')
const importLoading = ref(false)

// ====== Computed ======
const allCommands = computed(() => [...commands, ...customCommands.value])

const filteredCommands = computed(() => {
  let result = allCommands.value
  if (selectedCategory.value === 'custom') {
    result = result.filter(c => customCommandNames.value.has(c.name))
  } else if (selectedCategory.value !== 'all') {
    result = result.filter(c => c.category === selectedCategory.value)
  }
  if (showFavoritesOnly.value) {
    result = result.filter(c => favorites.value.has(c.name))
  }
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase().trim()
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.shortDesc.includes(q) ||
      c.description.includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  return result
})

// ====== Methods ======
const customCommandNames = computed(() => new Set(customCommands.value.map(c => c.name)))

function getCategoryCount(categoryId: string): number {
  if (categoryId === 'all') return allCommands.value.length
  if (categoryId === 'custom') return customCommands.value.length
  return allCommands.value.filter(c => c.category === categoryId).length
}

function selectCommand(cmd: LinuxCommand) {
  selectedCommand.value = cmd
}

function toggleFavorite(name: string) {
  if (favorites.value.has(name)) {
    favorites.value.delete(name)
  } else {
    favorites.value.add(name)
  }
  saveFavorites()
}

async function copyToClipboard(text: string, id: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => { copiedId.value = '' }, 2000)
    toast.success('已复制', 1500)
  } catch {
    // fallback for environments where clipboard API is not available
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      copiedId.value = id
      setTimeout(() => { copiedId.value = '' }, 2000)
      toast.success('已复制', 1500)
    } catch {
      toast.error('复制失败')
    }
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('linux-cmd-favorites', JSON.stringify([...favorites.value]))
  } catch { /* ignore */ }
}

function loadFavorites() {
  try {
    const data = localStorage.getItem('linux-cmd-favorites')
    if (data) {
      favorites.value = new Set(JSON.parse(data))
    }
  } catch { /* ignore */ }
}

// ====== Backend Integration ======
async function loadCustomCommands() {
  try {
    const [cmds, path] = await Promise.all([
      LinuxCmdService.GetCustomCommands(),
      LinuxCmdService.GetConfigPath(),
    ])
    customCommands.value = (cmds || []) as LinuxCommand[]
    configPath.value = path || ''
  } catch (e) {
    console.error('Failed to load custom commands:', e)
  }
}

async function deleteCustomCommand(name: string) {
  try {
    await LinuxCmdService.RemoveCustomCommand(name)
    toast.success('已删除')
    if (selectedCommand.value?.name === name) {
      selectedCommand.value = null
    }
    await loadCustomCommands()
  } catch (e: any) {
    toast.error(`删除失败: ${e?.message || String(e)}`)
  }
}

async function importCommands() {
  const text = importText.value.trim()
  if (!text) {
    toast.warning('请输入要导入的 JSON 数据')
    return
  }

  let cmds: any[]
  try {
    const parsed = JSON.parse(text)
    cmds = Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    toast.error('JSON 格式错误，请检查输入')
    return
  }

  for (const cmd of cmds) {
    if (!cmd.name || !cmd.shortDesc || !cmd.syntax) {
      toast.error(`命令 "${cmd.name || '未命名'}" 缺少必填字段（name, shortDesc, syntax）`)
      return
    }
    if (!Array.isArray(cmd.options)) cmd.options = []
    if (!Array.isArray(cmd.examples)) cmd.examples = []
    if (!Array.isArray(cmd.tags)) cmd.tags = []
    if (!cmd.category) cmd.category = 'custom'
    if (!cmd.description) cmd.description = cmd.shortDesc
  }

  importLoading.value = true
  try {
    const [added, skipped] = await LinuxCmdService.ImportCommands(cmds) as [number, number]
    let msg = `成功导入 ${added} 个命令`
    if (skipped > 0) msg += `，跳过 ${skipped} 个已存在的命令`
    toast.success(msg)
    importText.value = ''
    await loadCustomCommands()
  } catch (e: any) {
    toast.error(`导入失败: ${e?.message || String(e)}`)
  } finally {
    importLoading.value = false
  }
}

function toggleImportPanel() {
  showImportPanel.value = !showImportPanel.value
  if (!showImportPanel.value) {
    importText.value = ''
  }
}

function isCustomCommand(name: string): boolean {
  return customCommands.value.some(c => c.name === name)
}

async function openConfigFile() {
  try {
    await LinuxCmdService.OpenConfigFile()
  } catch (e: any) {
    toast.error(`打开失败: ${e?.message || String(e)}`)
  }
}

// Auto-load favorites
loadFavorites()

export function useLinuxCommands() {
  onMounted(() => {
    loadCustomCommands()
  })

  return {
    categories,
    selectedCategory,
    selectedCommand,
    searchText,
    copiedId,
    favorites,
    showFavoritesOnly,
    filteredCommands,
    getCategoryCount,
    selectCommand,
    toggleFavorite,
    copyToClipboard,
    // Backend
    customCommands,
    configPath,
    showImportPanel,
    importText,
    importLoading,
    deleteCustomCommand,
    importCommands,
    toggleImportPanel,
    isCustomCommand,
    openConfigFile,
  }
}
