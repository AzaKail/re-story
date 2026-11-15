import qrcode
# pip install qrcode[pil]

def generate_qr(url: str, filename: str = "qrcode.png") -> None:
    # Настройка параметров QR-кода
    qr = qrcode.QRCode(
        version=1,  # Размер матрицы (1 — самый маленький, 21x21; None — автовыбор)
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # Уровень коррекции ошибок (L, M, Q, H)
        box_size=10,  # Размер каждого квадратика в пикселях
        border=4,  # Ширина белой рамки (минимум 4 по стандарту)
    )

    # Добавляем ссылку и компилируем матрицу
    qr.add_data(url)
    qr.make(fit=True)

    # Создаем изображение и сохраняем
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    print(f"QR-код успешно сохранен в файл: {filename}")


if __name__ == "__main__":
    link = "https://github.com/AzaKail/re-story"
    generate_qr(link, "github-qr.png")