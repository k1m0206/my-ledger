import json
import os
from typing import Literal

from pydantic import BaseModel, Field

from config import DEFAULT_CATEGORIES


CATEGORIES_FILE = os.path.join(os.path.dirname(__file__), "categories.json")
CategoryType = Literal["income", "expense"]

DEFAULT_CATEGORY_ICONS = {
    "餐饮": "utensils",
    "购物": "shopping-bag",
    "服饰": "shirt",
    "日用": "home",
    "数码": "smartphone",
    "美妆": "sparkles",
    "护肤": "droplets",
    "应用软件": "app-window",
    "住房": "building",
    "交通": "car",
    "娱乐": "gamepad-2",
    "医疗": "heart",
    "通讯": "wifi",
    "汽车": "car",
    "学习": "book-open",
    "办公": "briefcase",
    "运动": "dumbbell",
    "社交": "users",
    "人情": "gift",
    "育儿": "baby",
    "宠物": "dog",
    "旅行": "plane",
    "度假": "palmtree",
    "烟酒": "wine",
    "彩票": "ticket",
    "工资": "wallet",
    "奖金": "trending-up",
    "加班": "clock",
    "福利": "gift",
    "公积金": "landmark",
    "红包": "hand-coins",
    "兼职": "briefcase",
    "副业": "piggy-bank",
    "退税": "badge-dollar-sign",
    "投资": "trending-up",
    "意外收入": "circle-dollar-sign",
    "其他": "circle-dollar-sign",
}


class CategoryItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="分类名称")
    icon: str = Field("circle-dollar-sign", min_length=1, max_length=50, description="分类图标标识")


class CategoryConfig(BaseModel):
    income: list[CategoryItem] = Field(default_factory=list, description="收入分类")
    expense: list[CategoryItem] = Field(default_factory=list, description="支出分类")


def default_category_config() -> CategoryConfig:
    return CategoryConfig(
        income=[
            CategoryItem(name=name, icon=DEFAULT_CATEGORY_ICONS.get(name, "circle-dollar-sign"))
            for name in DEFAULT_CATEGORIES["income"]
        ],
        expense=[
            CategoryItem(name=name, icon=DEFAULT_CATEGORY_ICONS.get(name, "circle-dollar-sign"))
            for name in DEFAULT_CATEGORIES["expense"]
        ],
    )


def load_categories() -> CategoryConfig:
    if not os.path.exists(CATEGORIES_FILE):
        return default_category_config()

    with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
        return CategoryConfig(**json.load(f))


def save_categories(categories: CategoryConfig):
    with open(CATEGORIES_FILE, "w", encoding="utf-8") as f:
        json.dump(categories.model_dump(), f, indent=2, ensure_ascii=False)


def category_names(categories: CategoryConfig) -> dict[str, list[str]]:
    return {
        "income": [item.name for item in categories.income],
        "expense": [item.name for item in categories.expense],
    }
