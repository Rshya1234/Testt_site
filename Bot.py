import requests, json

def get_fun_api(categorie):
    url = "https://l8pStudio.ir/apis-loop/api-fun.php"
    categories = {
        "جوک": "jock",
        "حدیث": "hadis",
        "فال": "fal",
        "فکت": "fact",
        "دعا": "doa",
        "دانستنی": "dnstni",
        "دقت": "deghat",
        "داستان": "dastan",
        "چیستان": "chistan",
        "بیو": "bio",
        "انگیزشی": "angizeshi",
        "خاطره": "khatereh",
        "خطبه": "khotbeh",
        "پ ن پ": "pnp",
        "تکست": "text",
        "چالش": "chalesh"
    }

    try:
        payload = {"category": categories.get(categorie, categorie)}
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            if data["status"]:
                return data['data']['content']
    except:pass

    return 'خطایی رخ داد.'

result = get_fun_api("doa")
print(result)
