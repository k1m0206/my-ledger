"""
支付宝账单解析 & 批量导入脚本

用法:
    python import_alipay.py 支付宝交易明细.csv
    python import_alipay.py 支付宝交易明细.csv --url http://localhost:8000
"""

import csv
import sys
import json
import urllib.request
from datetime import datetime
from pathlib import Path

API_BASE = "http://localhost:8000"

# 支付宝交易分类 -> 记账分类 映射
CATEGORY_MAP = {
    # 支出
    '餐饮美食': '餐饮',
    '交通出行': '交通',
    '生活服务': '日用',
    '日用百货': '日用',
    '住房缴费': '住房',
    '服饰装扮': '服饰',
    '美容美发': '美妆',
    '文化休闲': '娱乐',
    '酒店旅游': '旅行',
    '教育培训': '学习',
    '医疗健康': '医疗',
    '充值缴费': '通讯',
    '运动户外': '运动',
    '数码电器': '数码',
    '书籍音像': '学习',
    '社交': '社交',
    '宠物': '宠物',
    '汽车服务': '汽车',
    '办公': '办公',
    '母婴': '育儿',
    '烟酒': '烟酒',
    '转账': '人情',
    '其他': '其他',
    # 收入
    '收入': '其他',
    '退款': '其他',
}

# 关键词二次匹配（当分类不够精确时，根据商品说明匹配）
KEYWORD_MAP = {
    '餐饮': ['美团', '饿了么', '肯德基', '麦当劳', '瑞幸', '星巴克', '奶茶', '咖啡', '外卖', '餐厅', '饭店', '小吃', '面包', '蛋糕', '火锅', '烧烤'],
    '交通': ['滴滴', '高德', '地铁', '公交', '铁路', '12306', '打车', '共享单车', '哈啰', '青桔'],
    '购物': ['淘宝', '天猫', '京东', '拼多多', '超市', '便利店', '百货'],
    '服饰': ['优衣库', 'ZARA', '耐克', '阿迪'],
    '数码': ['苹果', 'Apple', '小米', '华为'],
    '美妆': ['完美日记', '花西子', '雅诗兰黛', '兰蔻'],
    '住房': ['房租', '水电', '物业', '燃气'],
    '娱乐': ['游戏', 'Steam', '电影', '影院', 'KTV'],
    '医疗': ['医院', '药店', '挂号', '体检'],
    '学习': ['课程', '培训', '书店', '当当'],
    '通讯': ['话费', '流量', '宽带', '中国移动', '中国联通', '中国电信'],
    '旅行': ['机票', '酒店', '民宿', '携程', '飞猪'],
    '人情': ['红包', '转账'],
    '宠物': ['猫粮', '狗粮', '宠物医院'],
    '汽车': ['加油', '停车', '洗车', '保养'],
    '办公': ['文具', '打印'],
    '育儿': ['奶粉', '尿不湿', '玩具'],
    '运动': ['健身', '游泳', '球场'],
    '社交': ['聚餐', '请客'],
}


def detect_encoding(filepath: str) -> str:
    """检测文件编码"""
    with open(filepath, 'rb') as f:
        raw = f.read(4096)
    # 尝试常见编码
    for enc in ['utf-8-sig', 'gbk', 'gb18030', 'utf-8']:
        try:
            raw.decode(enc)
            return enc
        except (UnicodeDecodeError, LookupError):
            continue
    return 'utf-8'


def guess_category(trade_category: str, description: str, counterparty: str) -> str:
    """根据交易分类和商品说明猜测记账分类"""
    # 1. 先用交易分类直接映射
    if trade_category in CATEGORY_MAP:
        mapped = CATEGORY_MAP[trade_category]
        if mapped != '其他':
            return mapped

    # 2. 根据关键词二次匹配
    text = f"{trade_category} {description} {counterparty}".lower()
    for cat, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw.lower() in text:
                return cat

    return '其他'


def parse_amount(amount_str: str) -> float:
    """解析金额字符串"""
    amount_str = amount_str.strip().replace(',', '').replace('¥', '').replace('￥', '')
    try:
        return float(amount_str)
    except ValueError:
        return 0.0


def parse_alipay_csv(filepath: str) -> list:
    """解析支付宝CSV账单文件"""
    encoding = detect_encoding(filepath)
    print(f"检测到文件编码: {encoding}")

    records = []
    header_found = False
    headers = []

    with open(filepath, 'r', encoding=encoding) as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            # 跳过元数据行，找到表头
            if not header_found:
                if line.startswith('交易时间') or line.startswith('交易时间,'):
                    headers = [h.strip() for h in line.split(',')]
                    header_found = True
                    print(f"找到表头 (第{line_num}行): {headers}")
                continue

            # 解析数据行
            parts = line.split(',')
            if len(parts) < 8:
                continue

            row = {}
            for i, h in enumerate(headers):
                if i < len(parts):
                    row[h] = parts[i].strip().strip('"').strip()

            # 只处理交易成功的记录
            status = row.get('交易状态', '')
            if status not in ('交易成功', '支付成功', '还款成功', '退款成功'):
                continue

            # 解析金额
            amount = parse_amount(row.get('金额', '0'))
            if amount <= 0:
                continue

            # 判断收支类型
            direction = row.get('收/支', '')
            if direction == '收入' or direction == '退款':
                ledger_type = 'income'
                category = '其他'
            elif direction == '支出':
                ledger_type = 'expense'
                trade_cat = row.get('交易分类', '')
                description = row.get('商品说明', '')
                counterparty = row.get('交易对方', '')
                category = guess_category(trade_cat, description, counterparty)
            else:
                # 不计收支（如转出到余额宝等）
                continue

            # 解析时间
            time_str = row.get('交易时间', '')
            try:
                # 支付宝格式: 2026/5/20 12:12 或 2026-05-20 12:12:59
                dt = datetime.strptime(time_str, '%Y/%m/%d %H:%M')
                date_iso = dt.strftime('%Y-%m-%dT%H:%M:%S')
            except ValueError:
                try:
                    dt = datetime.strptime(time_str, '%Y-%m-%d %H:%M:%S')
                    date_iso = dt.strftime('%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    try:
                        dt = datetime.strptime(time_str, '%Y/%m/%d %H:%M:%S')
                        date_iso = dt.strftime('%Y-%m-%dT%H:%M:%S')
                    except ValueError:
                        date_iso = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

            # 构建备注
            note_parts = []
            description = row.get('商品说明', '').strip()
            if description and description != '/':
                note_parts.append(description)
            counterparty = row.get('交易对方', '').strip()
            if counterparty and counterparty != '/':
                note_parts.append(counterparty)
            note = ' - '.join(note_parts) if note_parts else None

            records.append({
                'amount': amount,
                'type': ledger_type,
                'category': category,
                'date': date_iso,
                'note': note,
            })

    return records


def import_to_server(records: list, base_url: str):
    """批量导入到后端"""
    url = f"{base_url}/api/ledger/batch"
    data = json.dumps(records, ensure_ascii=False).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            print(f"\n导入成功: {result.get('message', '')}")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"\n导入失败 (HTTP {e.code}): {body}")
    except urllib.error.URLError as e:
        print(f"\n连接失败: {e.reason}")
        print("请确认后端服务已启动: python main.py")


def main():
    if len(sys.argv) < 2:
        print("用法: python import_alipay.py <支付宝账单.csv> [--url http://localhost:8000]")
        sys.exit(1)

    filepath = sys.argv[1]
    base_url = API_BASE

    if '--url' in sys.argv:
        idx = sys.argv.index('--url')
        if idx + 1 < len(sys.argv):
            base_url = sys.argv[idx + 1]

    if not os.path.exists(filepath):
        print(f"文件不存在: {filepath}")
        sys.exit(1)

    print(f"解析文件: {filepath}")
    print(f"后端地址: {base_url}")
    print("-" * 40)

    records = parse_alipay_csv(filepath)
    print(f"解析到 {len(records)} 条有效记录")

    if len(records) == 0:
        print("没有可导入的记录")
        sys.exit(0)

    # 统计
    income_count = sum(1 for r in records if r['type'] == 'income')
    expense_count = sum(1 for r in records if r['type'] == 'expense')
    income_total = sum(r['amount'] for r in records if r['type'] == 'income')
    expense_total = sum(r['amount'] for r in records if r['type'] == 'expense')

    print(f"收入: {income_count} 笔, ¥{income_total:.2f}")
    print(f"支出: {expense_count} 笔, ¥{expense_total:.2f}")
    print("-" * 40)

    # 确认导入
    confirm = input("确认导入? (y/N): ").strip().lower()
    if confirm != 'y':
        print("已取消")
        sys.exit(0)

    # 分批导入（每批100条）
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        print(f"导入第 {i + 1}-{i + len(batch)} 条...")
        import_to_server(batch, base_url)

    print("导入完成!")


if __name__ == '__main__':
    main()
