/*
    بعداً وقتی Flask آنلاین شد فقط این آدرس را تغییر می‌دهیم.
*/

const API = "http://127.0.0.1:5000";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

const result = document.getElementById("result");
const filesList = document.getElementById("filesList");


function formatSize(bytes) {
    if (bytes < 1024)
        return bytes + " B";

    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + " KB";

    if (bytes < 1024 * 1024 * 1024)
        return (bytes / 1024 / 1024).toFixed(1) + " MB";

    return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
}


fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (!file) {
        fileInfo.classList.add("hidden");
        return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = formatSize(file.size);

    fileInfo.classList.remove("hidden");
    result.classList.add("hidden");
});


uploadBtn.addEventListener("click", () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("اول یک فایل انتخاب کن.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    uploadBtn.disabled = true;
    progressBox.classList.remove("hidden");

    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";

    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API}/api/upload`);

    xhr.upload.addEventListener("progress", (event) => {

        if (!event.lengthComputable)
            return;

        const percent =
            Math.round((event.loaded / event.total) * 100);

        progressBar.style.width = percent + "%";
        progressPercent.textContent = percent + "%";
    });


    xhr.onload = () => {

        uploadBtn.disabled = false;

        try {

            const data = JSON.parse(xhr.responseText);

            if (!data.ok) {
                throw new Error(data.error || "خطا");
            }

            const link = API + data.url;

            result.innerHTML = `
                ✅ آپلود با موفقیت انجام شد!

                <br><br>

                <strong>${data.name}</strong>

                <br><br>

                🔗 لینک فایل:

                <br>

                <a href="${link}" target="_blank">
                    ${link}
                </a>
            `;

            result.classList.remove("hidden");

            loadFiles();

        } catch (error) {

            result.textContent =
                "❌ خطا: " + error.message;

            result.classList.remove("hidden");
        }
    };


    xhr.onerror = () => {

        uploadBtn.disabled = false;

        result.textContent =
            "❌ اتصال به سرور برقرار نشد.";

        result.classList.remove("hidden");
    };


    xhr.send(formData);
});


async function loadFiles() {

    try {

        const response =
            await fetch(`${API}/api/files`);

        const data = await response.json();

        if (!data.ok)
            throw new Error();

        if (data.files.length === 0) {

            filesList.textContent =
                "هنوز فایلی آپلود نشده.";

            return;
        }

        filesList.innerHTML = "";

        data.files.reverse().forEach(file => {

            const item =
                document.createElement("div");

            item.className = "file-item";

            const link = API + file.url;

            item.innerHTML = `
                📄
                <a href="${link}" target="_blank">
                    ${file.name}
                </a>

                <br>

                <small>
                    ${formatSize(file.size)}
                </small>
            `;

            filesList.appendChild(item);
        });

    } catch {

        filesList.textContent =
            "اتصال به API برقرار نشد.";
    }
}


loadFiles();
