from fastapi import APIRouter

router = APIRouter()

@router.post("/orientation/reset")
def reset_orientation():
    print("\n \033[92m" + "Orientation reset triggered!" + "\033[0m" + "\n")

    return {
        "success": True,
        "message": "Orientation reset command sent"
    }
