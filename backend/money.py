from decimal import Decimal, ROUND_HALF_UP


CENT = Decimal("0.01")


def amount_to_cents(amount: Decimal | float | int | str) -> int:
    decimal_amount = Decimal(str(amount)).quantize(CENT, rounding=ROUND_HALF_UP)
    return int(decimal_amount * 100)


def cents_to_amount(cents: int | None) -> float:
    return float(Decimal(cents or 0) / 100)
