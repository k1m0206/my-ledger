from fastapi import APIRouter, HTTPException

from category_store import CategoryConfig, default_category_config, load_categories, save_categories


router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/", response_model=CategoryConfig, summary="查询分类配置")
def get_category_config():
    return load_categories()


@router.put("/", response_model=CategoryConfig, summary="更新分类配置")
def update_category_config(categories: CategoryConfig):
    for category_type in ("income", "expense"):
        names = [item.name for item in getattr(categories, category_type)]
        if len(names) != len(set(names)):
            raise HTTPException(status_code=400, detail="同一类型下分类名称不能重复")

    save_categories(categories)
    return categories


@router.post("/reset", response_model=CategoryConfig, summary="重置默认分类配置")
def reset_category_config():
    categories = default_category_config()
    save_categories(categories)
    return categories
