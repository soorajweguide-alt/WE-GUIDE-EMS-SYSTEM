import qrcode
import base64
from io import BytesIO
import qrcode.image.svg

def generate_qrcode_base64(payload):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#6e40c9", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

def generate_qrcode_svg(payload):
    factory = qrcode.image.svg.SvgPathImage
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
        image_factory=factory
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image()
    buffered = BytesIO()
    img.save(buffered)
    return buffered.getvalue().decode('utf-8')
