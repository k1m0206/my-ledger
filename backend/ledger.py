"""
My Ledger CLI - AI Agent 快捷操作脚本

用法:
    # 记账
    python ledger.py add 25 餐饮 午餐
    python ledger.py add 5000 工资 --type income
    python ledger.py add 15 交通

    # 查询
    python ledger.py list                         # 本月账目
    python ledger.py list --month 2026-05         # 指定月份
    python ledger.py list --type expense          # 只看支出
    python ledger.py list --category 餐饮         # 指定分类
    python ledger.py list --last 10               # 最近10条

    # 统计
    python ledger.py summary                      # 本月统计
    python ledger.py summary --month 2026-05      # 指定月份
    python ledger.py summary --year 2026          # 指定年份

    # 分类
    python ledger.py categories                   # 所有分类
    python ledger.py categories --type expense    # 支出分类

    # 删除
    python ledger.py delete 1                     # 删除指定ID

    # 批量导入
    python ledger.py import 支付宝账单.csv
"""

import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"


def api(method, path, data=None):
    """调用后端API"""
    url = f"{BASE_URL}{path}"
    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'}, method=method)
    else:
        req = urllib.request.Request(url, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"错误 ({e.code}): {body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError:
        print("错误: 无法连接后端，请确认服务已启动 (python main.py)", file=sys.stderr)
        sys.exit(1)


def parse_time_input(time_str):
    """解析时间参数，支持多种格式"""
    now = datetime.now()
    time_str = time_str.strip().lower()

    if time_str == 'today' or time_str == '今天':
        return now.strftime('%Y-%m-%dT00:00:00'), now.strftime('%Y-%m-%dT23:59:59')
    elif time_str == 'yesterday' or time_str == '昨天':
        yesterday = now - timedelta(days=1)
        return yesterday.strftime('%Y-%m-%dT00:00:00'), yesterday.strftime('%Y-%m-%dT23:59:59')
    elif time_str == 'week' or time_str == '本周':
        start = now - timedelta(days=now.weekday())
        return start.strftime('%Y-%m-%dT00:00:00'), now.strftime('%Y-%m-%dT23:59:59')
    elif time_str.startswith('last') or time_str.startswith('近'):
        return None, None  # 特殊处理
    elif len(time_str) == 7:  # 2026-05
        year, month = map(int, time_str.split('-'))
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end = datetime(year, month + 1, 1) - timedelta(seconds=1)
        return start.strftime('%Y-%m-%dT%H:%M:%S'), end.strftime('%Y-%m-%dT%H:%M:%S')
    elif len(time_str) == 4:  # 2026
        year = int(time_str)
        return f'{year}-01-01T00:00:00', f'{year}-12-31T23:59:59'
    else:
        # 尝试解析日期
        try:
            dt = datetime.strptime(time_str, '%Y-%m-%d')
            return dt.strftime('%Y-%m-%dT00:00:00'), dt.strftime('%Y-%m-%dT23:59:59')
        except ValueError:
            return None, None


def cmd_add(args):
    """记账"""
    if len(args) < 2:
        print("用法: python ledger.py add <金额> <分类> [备注] [--type income|expense]")
        print("示例: python ledger.py add 25 餐饮 午餐")
        sys.exit(1)

    amount = float(args[0])
    category = args[1]

    # 解析可选参数
    note = None
    ledger_type = 'expense'

    i = 2
    while i < len(args):
        if args[i] == '--type' and i + 1 < len(args):
            ledger_type = args[i + 1]
            i += 2
        elif note is None:
            note = args[i]
            i += 1
        else:
            i += 1

    data = {
        'amount': amount,
        'type': ledger_type,
        'category': category,
        'note': note,
    }

    result = api('POST', '/api/ledger/', data)
    type_cn = '收入' if ledger_type == 'income' else '支出'
    print(f"记账成功: {type_cn} ¥{amount} [{category}]" + (f" - {note}" if note else ""))


def cmd_list(args):
    """查询账目"""
    params = {}
    has_date_param = False

    i = 0
    while i < len(args):
        if args[i] == '--month' and i + 1 < len(args):
            start, end = parse_time_input(args[i + 1])
            if start:
                params['start_date'] = start
                params['end_date'] = end
                has_date_param = True
            i += 2
        elif args[i] == '--date' and i + 1 < len(args):
            start, end = parse_time_input(args[i + 1])
            if start:
                params['start_date'] = start
                params['end_date'] = end
                has_date_param = True
            i += 2
        elif args[i] == '--start' and i + 1 < len(args):
            start, _ = parse_time_input(args[i + 1])
            if start:
                params['start_date'] = start
                has_date_param = True
            i += 2
        elif args[i] == '--end' and i + 1 < len(args):
            _, end = parse_time_input(args[i + 1])
            if end:
                params['end_date'] = end
                has_date_param = True
            i += 2
        elif args[i] == '--type' and i + 1 < len(args):
            params['type'] = args[i + 1]
            i += 2
        elif args[i] == '--category' and i + 1 < len(args):
            params['category'] = args[i + 1]
            i += 2
        elif args[i] == '--last' and i + 1 < len(args):
            params['limit'] = int(args[i + 1])
            i += 2
        elif args[i] == '--limit' and i + 1 < len(args):
            params['limit'] = int(args[i + 1])
            i += 2
        else:
            i += 1

    # 如果没有日期参数，默认当月
    if not has_date_param:
        now = datetime.now()
        start = datetime(now.year, now.month, 1)
        if now.month == 12:
            end = datetime(now.year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end = datetime(now.year, now.month + 1, 1) - timedelta(seconds=1)
        params['start_date'] = start.strftime('%Y-%m-%dT%H:%M:%S')
        params['end_date'] = end.strftime('%Y-%m-%dT%H:%M:%S')

    qs = urllib.parse.urlencode(params)
    records = api('GET', f'/api/ledger/?{qs}')

    if not records:
        print("暂无记录")
        return

    print(f"共 {len(records)} 条记录:")
    print("-" * 60)
    for r in records:
        type_cn = '收' if r['type'] == 'income' else '支'
        sign = '+' if r['type'] == 'income' else '-'
        date = r['date'][:16].replace('T', ' ')
        note = f" ({r['note']})" if r.get('note') else ''
        print(f"  [{r['id']}] {date} {type_cn} {sign}¥{r['amount']:.2f} {r['category']}{note}")
    print("-" * 60)


def cmd_summary(args):
    """统计汇总"""
    params = {}

    i = 0
    while i < len(args):
        if args[i] == '--month' and i + 1 < len(args):
            start, end = parse_time_input(args[i + 1])
            if start:
                params['start_date'] = start
                params['end_date'] = end
            i += 2
        elif args[i] == '--year' and i + 1 < len(args):
            start, end = parse_time_input(args[i + 1])
            if start:
                params['start_date'] = start
                params['end_date'] = end
            i += 2
        else:
            i += 1

    # 默认当月
    if not params:
        now = datetime.now()
        start = datetime(now.year, now.month, 1)
        if now.month == 12:
            end = datetime(now.year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end = datetime(now.year, now.month + 1, 1) - timedelta(seconds=1)
        params['start_date'] = start.strftime('%Y-%m-%dT%H:%M:%S')
        params['end_date'] = end.strftime('%Y-%m-%dT%H:%M:%S')

    qs = urllib.parse.urlencode(params)
    result = api('GET', f'/api/ledger/summary/?{qs}')

    print(f"统计汇总:")
    print(f"  收入: +¥{result['total_income']:.2f}")
    print(f"  支出: -¥{result['total_expense']:.2f}")
    print(f"  结余: ¥{result['net_income']:.2f}")
    print(f"  笔数: {result['count']}")


def cmd_categories(args):
    """查询分类"""
    params = {}
    if args and args[0] == '--type' and len(args) > 1:
        params['type'] = args[1]

    qs = urllib.parse.urlencode(params) if params else ''
    result = api('GET', f'/api/ledger/categories/?{qs}')

    if isinstance(result, dict) and 'income' in result:
        print("收入分类:")
        for c in result['income']:
            print(f"  - {c}")
        print("支出分类:")
        for c in result['expense']:
            print(f"  - {c}")
    elif isinstance(result, dict) and 'type' in result:
        print(f"{result['type']}分类:")
        for c in result['categories']:
            print(f"  - {c}")


def cmd_delete(args):
    """删除账目"""
    if not args:
        print("用法: python ledger.py delete <id>")
        sys.exit(1)

    ledger_id = int(args[0])
    api('DELETE', f'/api/ledger/{ledger_id}')
    print(f"已删除记录 #{ledger_id}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]
    args = sys.argv[2:]

    commands = {
        'add': cmd_add,
        'new': cmd_add,
        '记': cmd_add,
        '记账': cmd_add,
        'list': cmd_list,
        'ls': cmd_list,
        '查': cmd_list,
        '查询': cmd_list,
        'summary': cmd_summary,
        '统计': cmd_summary,
        'categories': cmd_categories,
        '分类': cmd_categories,
        'delete': cmd_delete,
        'del': cmd_delete,
        '删除': cmd_delete,
    }

    if cmd in commands:
        commands[cmd](args)
    else:
        print(f"未知命令: {cmd}")
        print(f"可用命令: {', '.join(commands.keys())}")
        sys.exit(1)


if __name__ == '__main__':
    main()
