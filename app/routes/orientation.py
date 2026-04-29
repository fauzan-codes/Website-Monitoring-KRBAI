from fastapi import APIRouter

router = APIRouter()

@router.post("/orientation/reset")
def reset_orientation():
    print("Orientation reset triggered!\n\n\n")

    return {
        "success": True,
        "message": "Orientation reset command sent"
    }
