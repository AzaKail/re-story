import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "artifacts.json"


def load_dataset():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    bodies = {}
    artifacts = []
    sources = {}

    for r in records:
        model = r.get("model")
        if model == "catalog.body":
            bodies[r["pk"]] = r["fields"]
        elif model == "catalog.artifact":
            artifacts.append(r)
        elif model == "catalog.source":
            art_pk = r["fields"]["artifact"]
            sources.setdefault(art_pk, []).append(r["fields"])

    return bodies, artifacts, sources


def build_english_doc(bodies, artifacts, sources):
    lines = [
        "================================================================================",
        "SILENT PIONEERS - NASA DISCARDED EQUIPMENT KNOWLEDGE BASE",
        "Language: English (en)",
        "Source: NASA Space Science Data Coordinated Archive & NASA Science Missions",
        "================================================================================\n",
    ]

    for item in artifacts:
        pk = item["pk"]
        f = item["fields"]
        body = bodies.get(f["body"], {})
        art_sources = sources.get(pk, [])

        location_str = (
            f"{f['latitude']} deg, {f['longitude']} deg"
            if f["latitude"] is not None and f["longitude"] is not None
            else (f["orbit_parameters"] or "Interstellar trajectory")
        )

        lines.append("--------------------------------------------------------------------------------")
        lines.append(f"EQUIPMENT: {f['name']} (ID: {f['code']})")
        lines.append("--------------------------------------------------------------------------------")
        lines.append(f"Celestial Body: {body.get('name', 'Unknown')}")
        lines.append(f"Equipment Category: {f['artifact_type'].replace('_', ' ').title()}")
        lines.append(f"Surface Location / Trajectory: {location_str}")
        lines.append(f"Launch Date: {f.get('launch_date') or 'N/A'}")
        lines.append(f"Landing Date: {f.get('landing_date') or 'Orbital / Deep Space'}")
        lines.append(f"Mission End Date: {f.get('end_of_mission_date') or 'Permanent Landmark'}")
        lines.append(f"Operational Status: {f.get('status', 'N/A')}\n")

        lines.append("Mission Summary:")
        lines.append(f.get("brief_description", "").strip() + "\n")

        lines.append("First-Person Story Narrative:")
        lines.append(f.get("first_person_story", "").strip() + "\n")

        lines.append("Key Engineering & Scientific Facts:")
        for fact in f.get("key_facts", []):
            lines.append(f"- {fact}")
        lines.append("")

        fleet = f.get("fleet_members", [])
        if fleet:
            lines.append("Sister Craft & Fleet Sites:")
            for member in fleet:
                mission = member.get("mission") or member.get("name") or "Unknown"
                site = member.get("landing_site") or member.get("trajectory") or "N/A"
                coords = member.get("coordinates") or member.get("operational_span") or "N/A"
                date = member.get("landing_date") or member.get("last_signal") or "N/A"
                lines.append(f"- {mission} | Site: {site} | Coordinates/Span: {coords} | Date: {date}")
            lines.append("")

        if art_sources:
            lines.append("Official NASA Master Archive Sources:")
            for src in art_sources:
                details = f" ({src.get('details')})" if src.get("details") else ""
                lines.append(f"- {src.get('title')}: {src.get('url')}{details}")
            lines.append("")

        lines.append("\n")

    return "\n".join(lines)


def build_russian_doc(bodies, artifacts, sources):
    body_names = {
        "moon": "Луна",
        "mars": "Марс",
        "ceres": "Церера",
        "eros": "433 Эрос",
        "solar_system": "Дальний космос",
    }
    type_names = {
        "lander": "Посадочный аппарат / станция",
        "rover": "Планетоход / марсоход",
        "scientific_package": "Научный приборный комплекс",
        "helicopter": "Винтокрылый летательный аппарат",
        "orbiter": "Орбитальный зонд",
        "probe": "Автоматический зонд",
        "space_telescope": "Космический телескоп",
    }

    lines = [
        "================================================================================",
        "SILENT PIONEERS - БАЗА ЗНАНИЙ ОБ ОСТАВЛЕННОЙ ТЕХНИКЕ NASA",
        "Язык: Русский (ru)",
        "Источники: Архивы NASA NSSDCA и научные миссии NASA Science",
        "================================================================================\n",
    ]

    for item in artifacts:
        pk = item["pk"]
        f = item["fields"]
        body_obj = bodies.get(f["body"], {})
        body_code = body_obj.get("code", "")
        body_name = body_names.get(body_code, body_obj.get("name", "Космос"))
        trans = f.get("translations", {}).get("ru", {})
        art_sources = sources.get(pk, [])

        name = trans.get("name") or f["name"]
        status = trans.get("status") or f["status"]
        brief = trans.get("brief_description") or f["brief_description"]
        story = trans.get("first_person_story") or f["first_person_story"]
        facts = trans.get("key_facts") or f.get("key_facts", [])
        fleet = trans.get("fleet_members") or f.get("fleet_members", [])

        location_str = (
            f"{f['latitude']} град., {f['longitude']} град."
            if f["latitude"] is not None and f["longitude"] is not None
            else (f["orbit_parameters"] or "Межзвездная траектория")
        )
        type_str = type_names.get(f["artifact_type"], f["artifact_type"])

        lines.append("--------------------------------------------------------------------------------")
        lines.append(f"АППАРАТ: {name} (Код: {f['code']})")
        lines.append("--------------------------------------------------------------------------------")
        lines.append(f"Небесное тело: {body_name}")
        lines.append(f"Тип оборудования: {type_str}")
        lines.append(f"Координаты на поверхности / траектория: {location_str}")
        lines.append(f"Дата запуска: {f.get('launch_date') or 'Нет данных'}")
        lines.append(f"Дата посадки: {f.get('landing_date') or 'Орбита / Дальний космос'}")
        lines.append(f"Дата завершения миссии: {f.get('end_of_mission_date') or 'Вечный памятник'}")
        lines.append(f"Текущий статус: {status}\n")

        lines.append("Краткое описание миссии:")
        lines.append(brief.strip() + "\n")

        lines.append("История от первого лица:")
        lines.append(story.strip() + "\n")

        lines.append("Ключевые инженерные и научные факты:")
        for fact in facts:
            lines.append(f"- {fact}")
        lines.append("")

        if fleet:
            lines.append("Аппараты серии и родственные посадочные площадки:")
            for member in fleet:
                mission = member.get("mission") or member.get("name") or "Неизвестно"
                site = member.get("landing_site") or member.get("trajectory") or "Н/Д"
                coords = member.get("coordinates") or member.get("operational_span") or "Н/Д"
                date = member.get("landing_date") or member.get("last_signal") or "Н/Д"
                lines.append(f"- {mission} | Место: {site} | Координаты/Срок: {coords} | Дата: {date}")
            lines.append("")

        if art_sources:
            lines.append("Официальные первоисточники NASA:")
            for src in art_sources:
                details = f" ({src.get('details')})" if src.get("details") else ""
                lines.append(f"- {src.get('title')}: {src.get('url')}{details}")
            lines.append("")

        lines.append("\n")

    return "\n".join(lines)


def build_kazakh_doc(bodies, artifacts, sources):
    body_names = {
        "moon": "Ай",
        "mars": "Марс",
        "ceres": "Церера",
        "eros": "433 Эрос",
        "solar_system": "Терең ғарыш",
    }
    type_names = {
        "lander": "Қону аппараты / станция",
        "rover": "Ғаламшар көлігі / марсоход",
        "scientific_package": "Ғылыми аспаптар кешені",
        "helicopter": "Қалақты ұшу аппараты",
        "orbiter": "Орбиталық аппарат",
        "probe": "Автоматты ғарыш зонды",
        "space_telescope": "Ғарыш телескопы",
    }

    lines = [
        "================================================================================",
        "SILENT PIONEERS - NASA ТАСТАП КЕТКЕН ТЕХНИКАСЫ ТУРАЛЫ БІЛІМ БАЗАСЫ",
        "Тіл: Қазақша (kk)",
        "Дереккөздер: NASA NSSDCA ресми мұрағаты және NASA Science ғылыми миссиялары",
        "================================================================================\n",
    ]

    for item in artifacts:
        pk = item["pk"]
        f = item["fields"]
        body_obj = bodies.get(f["body"], {})
        body_code = body_obj.get("code", "")
        body_name = body_names.get(body_code, body_obj.get("name", "Ғарыш"))
        trans = f.get("translations", {}).get("kk", {})
        art_sources = sources.get(pk, [])

        name = trans.get("name") or f["name"]
        status = trans.get("status") or f["status"]
        brief = trans.get("brief_description") or f["brief_description"]
        story = trans.get("first_person_story") or f["first_person_story"]
        facts = trans.get("key_facts") or f.get("key_facts", [])
        fleet = trans.get("fleet_members") or f.get("fleet_members", [])

        location_str = (
            f"{f['latitude']} град., {f['longitude']} град."
            if f["latitude"] is not None and f["longitude"] is not None
            else (f["orbit_parameters"] or "Жұлдызаралық траектория")
        )
        type_str = type_names.get(f["artifact_type"], f["artifact_type"])

        lines.append("--------------------------------------------------------------------------------")
        lines.append(f"АППАРАТ: {name} (Код: {f['code']})")
        lines.append("--------------------------------------------------------------------------------")
        lines.append(f"Аспан денесі: {body_name}")
        lines.append(f"Жабдық түрі: {type_str}")
        lines.append(f"Беткі координаттары / траектория: {location_str}")
        lines.append(f"Ұшыру күні: {f.get('launch_date') or 'Мәлімет жоқ'}")
        lines.append(f"Қону күні: {f.get('landing_date') or 'Орбита / Терең ғарыш'}")
        lines.append(f"Миссияның аяқталу күні: {f.get('end_of_mission_date') or 'Мәңгілік ескерткіш'}")
        lines.append(f"Ағымдағы мәртебесі: {status}\n")

        lines.append("Миссияның қысқаша мазмұны:")
        lines.append(brief.strip() + "\n")

        lines.append("Бірінші жақтан баяндау (аппараттың өз сөзі):")
        lines.append(story.strip() + "\n")

        lines.append("Негізгі инженерлік және ғылыми деректер:")
        for fact in facts:
            lines.append(f"- {fact}")
        lines.append("")

        if fleet:
            lines.append("Сериялық аппараттар және қону орындары:")
            for member in fleet:
                mission = member.get("mission") or member.get("name") or "Белгісіз"
                site = member.get("landing_site") or member.get("trajectory") or "Жоқ"
                coords = member.get("coordinates") or member.get("operational_span") or "Жоқ"
                date = member.get("landing_date") or member.get("last_signal") or "Жоқ"
                lines.append(f"- {mission} | Орын: {site} | Координаттар/Мерзім: {coords} | Күн: {date}")
            lines.append("")

        if art_sources:
            lines.append("NASA ресми бастапқы дереккөздері:")
            for src in art_sources:
                details = f" ({src.get('details')})" if src.get("details") else ""
                lines.append(f"- {src.get('title')}: {src.get('url')}{details}")
            lines.append("")

        lines.append("\n")

    return "\n".join(lines)


def main():
    bodies, artifacts, sources = load_dataset()

    en_content = build_english_doc(bodies, artifacts, sources)
    ru_content = build_russian_doc(bodies, artifacts, sources)
    kk_content = build_kazakh_doc(bodies, artifacts, sources)

    # 1. Master segmented file
    combined_lines = [
        "################################################################################",
        "SILENT PIONEERS - COMPLETE NASA EQUIPMENT KNOWLEDGE BASE FOR AI CHATBOT",
        "SEGMENTED BY LANGUAGE: ENGLISH (en), RUSSIAN (ru), KAZAKH (kk)",
        "################################################################################\n\n",
        "=== SECTION 1: ENGLISH KNOWLEDGE BASE (en) ===\n",
        en_content,
        "\n\n=== SECTION 2: RUSSIAN KNOWLEDGE BASE (ru) ===\n",
        ru_content,
        "\n\n=== SECTION 3: KAZAKH KNOWLEDGE BASE (kk) ===\n",
        kk_content,
    ]
    master_file = BASE_DIR / "data" / "equipment_knowledge_base.txt"
    with open(master_file, "w", encoding="utf-8") as f:
        f.write("\n".join(combined_lines))

    # 2. Per-language files (ideal for individual KnowledgeDocument uploads)
    en_file = BASE_DIR / "data" / "knowledge_base_en.txt"
    with open(en_file, "w", encoding="utf-8") as f:
        f.write(en_content)

    ru_file = BASE_DIR / "data" / "knowledge_base_ru.txt"
    with open(ru_file, "w", encoding="utf-8") as f:
        f.write(ru_content)

    kk_file = BASE_DIR / "data" / "knowledge_base_kk.txt"
    with open(kk_file, "w", encoding="utf-8") as f:
        f.write(kk_content)

    print(f"Generated: {master_file} ({master_file.stat().st_size} bytes)")
    print(f"Generated: {en_file} ({en_file.stat().st_size} bytes)")
    print(f"Generated: {ru_file} ({ru_file.stat().st_size} bytes)")
    print(f"Generated: {kk_file} ({kk_file.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
