import os

# 数据库配置
DATABASE_URL = os.getenv("MY_LEDGER_DATABASE_URL", "sqlite:///./ledger.db")

# 服务器配置
HOST = os.getenv("MY_LEDGER_BACKEND_HOST", "127.0.0.1")
PORT = int(os.getenv("MY_LEDGER_BACKEND_PORT", "8000"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "MY_LEDGER_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

# 账目类型常量
LEDGER_TYPE_INCOME = "income"  # 收入
LEDGER_TYPE_EXPENSE = "expense"  # 支出

# 默认分类
DEFAULT_CATEGORIES = {
    "income": [
        "工资", "奖金", "加班", "福利", "公积金", "红包",
        "兼职", "副业", "退税", "投资", "意外收入", "其他"
    ],
    "expense": [
        "餐饮", "购物", "服饰", "日用", "数码", "美妆", "护肤",
        "应用软件", "住房", "交通", "娱乐", "医疗", "通讯", "汽车",
        "学习", "办公", "运动", "社交", "人情", "育儿", "宠物",
        "旅行", "度假", "烟酒", "彩票", "其他"
    ]
}
