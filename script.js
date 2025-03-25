// Konfigurace Cloudinary
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/drrzl7evt/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "AKR_Preset";

let photos = [];
let selectedShop = null;
let categories = [];

const shopZvoleBtn = document.getElementById("shop-zvole");
const shopMoraBtn = document.getElementById("shop-mora");
const photoInput = document.getElementById("photo-input");
const takePhotoBtn = document.getElementById("take-photo-btn");
const photoCount = document.getElementById("photo-count").querySelector("span");
const productDetails = document.getElementById("product-details");
const categorySelection = document.getElementById("category-selection");
const status = document.getElementById("status");
const progressBar = document.getElementById("progress-bar");
const progress = document.getElementById("progress");
const shopSelectionSection = document.getElementById("shop-selection");
const photoSectionSection = document.getElementById("photo-section");
const finishSection = document.getElementById("finish-section");
const categoryBtn = document.getElementById("category-btn");
const categoryIdInput = document.getElementById("category-id");
const categoryModal = document.getElementById("category-modal");
const categorySearch = document.getElementById("category-search");
const categoryList = document.getElementById("category-list");
const categoryCloseBtn = document.getElementById("category-close-btn");
const confirmModal = document.getElementById("confirm-modal");
const confirmYesBtn = document.getElementById("confirm-yes");
const confirmNoBtn = document.getElementById("confirm-no");
const finishBtn = document.getElementById("finish-btn");
const resetBtn = document.getElementById("reset-btn");

// Načtení kategorií ze souboru MapaKat.txt
fetch("MapaKat.txt")
    .then(response => response.text())
    .then(text => {
        // Split by newlines and clean up any extra whitespace
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        categories = lines.map(line => {
            // Match the category name and ID using a more robust regex
            const match = line.match(/^(.*?)\((\d+)\)$/);
            if (match) {
                const name = match[1].trim();
                const id = parseInt(match[2]);
                return { name, id };
            }
            return null;
        }).filter(category => category);

        // Log categories for debugging
        console.log("Parsed categories:", categories);
    })
    .catch(error => console.error("Chyba při načítání kategorií:", error));

// Funkce pro aktualizaci statusu
function updateStatus(message) {
    status.textContent = message;
}

// Funkce pro aktualizaci počtu produktů přidaných dnes
function updateTodayProductCount() {
    const today = new Date().toISOString().split("T")[0];
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const todayProducts = products.filter(product => {
        if (!product.createdAt) return false;
        return product.createdAt.split("T")[0] === today;
    });
    const countDiv = document.getElementById("today-product-count");
    countDiv.textContent = `Dnes přidáno: ${todayProducts.length} produktů`;
}

// Modální okno pro potvrzení
function showConfirmModal() {
    confirmModal.classList.remove("hidden");
    return new Promise((resolve) => {
        confirmYesBtn.onclick = () => {
            confirmModal.classList.add("hidden");
            resolve(true);
        };
        confirmNoBtn.onclick = () => {
            confirmModal.classList.add("hidden");
            resolve(false);
        };
    });
}

// Funkce pro aktualizaci historie umístění
function updateLocationHistory() {
    const locationHistoryDiv = document.getElementById("location-history");
    const locations = JSON.parse(localStorage.getItem("locationHistory")) || [];
    
    if (locations.length === 0) {
        locationHistoryDiv.textContent = "Žádná historie umístění.";
    } else {
        locationHistoryDiv.innerHTML = "Historie: " + locations.map(loc => 
            `<span class="cursor-pointer underline" onclick="document.getElementById('product-location').value='${loc}'">${loc}</span>`
        ).join(", ");
    }
}

// Inicializace
updateStatus("👉 ZAČNI VÝBĚREM OBCHODU");
document.addEventListener("DOMContentLoaded", () => {
    updateTodayProductCount();
});

// Výběr obchodu
shopZvoleBtn.addEventListener("click", () => {
    selectedShop = "Z";
    shopSelectionSection.classList.add("hidden");
    photoSectionSection.classList.remove("hidden");
    updateStatus("👉 VYBRAL JSI ANTIK ZVOLE. NAFOŤ PRVNÍ FOTKU.");
});

shopMoraBtn.addEventListener("click", () => {
    selectedShop = "M";
    shopSelectionSection.classList.add("hidden");
    photoSectionSection.classList.remove("hidden");
    updateStatus("👉 VYBRAL JSI ANTIK MORA. NAFOŤ PRVNÍ FOTKU.");
});

takePhotoBtn.addEventListener("click", () => {
    if (photos.length < 3) {
        photoInput.click();
    } else {
        updateStatus("✅ MÁŠ UŽ 3 FOTKY! VYPLŇ NÁZEV A CENU.");
    }
});

photoInput.addEventListener("change", () => {
    if (photoInput.files.length) {
        photos.push(photoInput.files[0]);
        photoCount.textContent = `${photos.length}/3`;
        photoInput.value = "";
        updateStatus(`📸 NAFOCENA FOTKA ${photos.length}/3. ${photos.length < 3 ? "POKRAČUJ DALŠÍ FOTKOU." : "VYPLŇ NÁZEV A CENU."}`);
        if (photos.length === 3) {
            photoSectionSection.classList.add("hidden");
            productDetails.classList.remove("hidden");
            takePhotoBtn.disabled = true;
            updateLocationHistory();
        }
    }
});

// Modální okno pro výběr kategorie
categoryBtn.addEventListener("click", () => {
    categoryModal.classList.remove("hidden");
    categorySearch.value = "";
    updateCategoryList("");
});

categorySearch.addEventListener("input", () => {
    const query = categorySearch.value.toLowerCase().trim();
    updateCategoryList(query);
});

function updateCategoryList(query) {
    categoryList.innerHTML = "";
    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(query)
    ).sort((a, b) => {
        const aIndex = a.name.toLowerCase().indexOf(query);
        const bIndex = b.name.toLowerCase().indexOf(query);
        return aIndex - bIndex || a.name.localeCompare(b.name);
    });

    filteredCategories.forEach(category => {
        const btn = document.createElement("button");
        btn.textContent = category.name; // Display only the name
        btn.dataset.id = category.id; // Set the data-id attribute
        btn.classList.add("category-item");
        btn.addEventListener("click", () => {
            categoryIdInput.value = category.id;
            categoryBtn.textContent = `Vybrána kategorie: ${category.name}`;
            categoryModal.classList.add("hidden");
            updateStatus("✅ KATEGORIE VYBRÁNA! POKRAČUJ NA DOKONČENÍ.");
        });
        categoryList.appendChild(btn);
    });

    if (filteredCategories.length === 0) {
        categoryList.innerHTML = "<p class='text-gray-500 p-2'>Žádné kategorie nenalezeny.</p>";
    }
}

categoryCloseBtn.addEventListener("click", () => {
    categoryModal.classList.add("hidden");
});

// Nahrání souboru na Cloudinary
async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", file.type.includes("image") ? "media_library" : "excel_files");

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chyba při nahrávání: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.secure_url;
}

// Přidání produktu
async function addProduct() {
    const name = document.getElementById("product-name").value;
    const price = document.getElementById("product-price").value;
    const categoryId = categoryIdInput.value;
    const location = document.getElementById("product-location").value.trim();
    const shippingMethod = document.getElementById("shipping-method").value;

    if (!name || !price || !categoryId) {
        updateStatus("⚠️ VYPLŇ NÁZEV, CENU A VYBER KATEGORII!");
        return;
    }

    updateStatus("⏳ ZPRACOVÁVÁM A NAHRÁVÁM FOTKY...");
    progressBar.classList.remove("hidden");

    try {
        const photoUrls = [];
        for (let i = 0; i < photos.length; i++) {
            updateStatus(`🖼️ NAHRÁVÁM OBRÁZEK ${i + 1}/3...`);
            const url = await uploadFile(photos[i]);
            photoUrls.push(url);
            progress.style.width = `${((i + 1) / photos.length) * 100}%`;
            updateStatus(`📤 NAHRÁN OBRÁZEK ${i + 1}/3...`);
        }

        const formattedName = `${name.toUpperCase()} | [${selectedShop}]`;

        if (location) {
            let locationHistory = JSON.parse(localStorage.getItem("locationHistory")) || [];
            if (!locationHistory.includes(location)) {
                locationHistory.push(location);
                localStorage.setItem("locationHistory", JSON.stringify(locationHistory));
            }
        }

        function getRoundedISODate() {
            let date = new Date();
            date.setUTCMinutes(0, 0, 0);
            date.setUTCHours(date.getUTCHours() + 1);
            return date.toISOString().replace(".000Z", "Z");
        }

        let lastEntityId = parseInt(localStorage.getItem("lastEntityId")) || 0;
        lastEntityId += 1;
        localStorage.setItem("lastEntityId", lastEntityId);

        const product = {
            entityId: lastEntityId,
            name: formattedName,
            language: "cs-CZ",
            extId: location || "",
            categoryId: parseInt(categoryId),
            description: `<div class="aukro-offer-default"><div data-layout="text"><div><h3><strong>🛒 NABÍZENÉ ZBOŽÍ 🎁</strong></h3><p>Stav viz. fotografie 📸</p><p><strong> Pro dotazy k aukcím preferuji komunikaci e-mailem, z důvodu flexibilnějšího a rychlejšího vyřízení požadavku. Přeji Vám příjemnou dražbu! 💌 Podívejte se i na mé další aukce a objevte skvělé nabídky! 🚀</strong></p><p><br></p><h3><strong>⚠️ INFORMACE O AUKCI :</strong></h3><p>Na platby čekám jeden týden od vydražení aukce, zboží <strong>zasílám 7-10 dní po obdržení platby</strong>. Zboží bude znovu vystaveno, zda-li nebude uhrazeno v této lhůtě.</p><p>Berte prosím na vědomí, že vydražené zboží <strong>nezasílám na DOBÍRKU</strong>. Zboží mohu zasílat přes <strong>KURÝRNÍ SLUŽBU (DPD) & také ZÁSILKOVNU</strong>.</p><p><br></p><h3><strong>💳 PLATBA :</strong></h3><p>Platbu můžete uskutečnit pouze <strong>BANKOVNÍM PŘEVODEM</strong>. Číslo bankovního účtu <strong>najdete ve výherním e-mailu</strong>. Děkuji za pochopení. <strong>(Při platbě BANKOVNÍM PŘEVODEM, prosím uvést ČÍSLO NABÍDKY, které je uvedeno u AUKCE)</strong></p><p><a href="https://aukro.cz/uzivatel/ZvoleAnt/nabidky"><img src="https://i.postimg.cc/nMbG3ZG9/A.png" alt="Nabízené zboží" style="display:block; margin:auto;"></a></p></div></div></div>`,
            auctionPriceAmount: parseInt(price),
            auctionPriceCurrency: "CZK",
            buyNowPriceAmount: 0,
            buyNowPriceCurrency: "CZK",
            quantity: 1,
            quantityUnit: "pieces",
            startingAt: getRoundedISODate(),
            duration: 7,
            reexposeType: 0,
            location: JSON.stringify({ countryCode: "CZ", postCode: "789 01", city: "Zvole" }),
            shippingTemplateId: parseInt(shippingMethod),
            shippingPayer: "buyer",
            images: photoUrls.join(" "),
            bestOffer: 1,
            onlyVerifiedBuyersEnabledOverride: 0,
            attributes: JSON.stringify(),
            createdAt: new Date().toISOString()
        };

        let products = JSON.parse(localStorage.getItem("products")) || [];
        products.push(product);
        localStorage.setItem("products", JSON.stringify(products));

        photos = [];
        photoCount.textContent = "0/3";
        document.getElementById("product-name").value = "";
        document.getElementById("product-price").value = "";
        document.getElementById("product-location").value = "";
        categoryIdInput.value = "";
        categoryBtn.textContent = "🔍 Vybrat kategorii";
        finishSection.classList.add("hidden");
        photoSectionSection.classList.remove("hidden");
        takePhotoBtn.disabled = false;

        updateStatus("🎉 PRODUKT PŘIDÁN! MŮŽEŠ DOKONČIT NEBO PŘIDAT DALŠÍ.");
        updateTodayProductCount();
    } catch (error) {
        updateStatus(`❌ CHYBA PŘI ZPRACOVÁNÍ NEBO NAHRÁVÁNÍ FOTEK: ${error.message}`);
    }
}

// Funkce pro přidání dalšího produktu
function addAnotherProduct() {
    finishSection.classList.add("hidden");
    photoSectionSection.classList.remove("hidden");
    updateStatus("👉 NAFOŤ FOTKY PRO DALŠÍ PRODUKT.");
}

// Dokončení a odeslání přes WhatsApp
async function finish() {
    const confirmed = await showConfirmModal();
    if (!confirmed) return;

    const products = JSON.parse(localStorage.getItem("products")) || [];
    const savedProductsDiv = document.getElementById("saved-products");
    savedProductsDiv.innerHTML = "";

    if (products.length === 0) {
        savedProductsDiv.innerHTML = "<p>Žádné produkty nebyly přidány. 😕</p>";
        updateStatus("⚠️ PŘIDEJ ALESPOŇ JEDEN PRODUKT PŘED DOKONČENÍM.");
        return;
    }

    const headers = [
        "entityId", "name", "language", "extId", "categoryId", "description",
        "auctionPriceAmount", "auctionPriceCurrency", "buyNowPriceAmount", "buyNowPriceCurrency",
        "quantity", "quantityUnit", "startingAt", "duration", "reexposeType",
        "location", "shippingTemplateId", "shippingPayer", "images", "bestOffer",
        "onlyVerifiedBuyersEnabledOverride", "attributes"
    ];

    const data = products.map(product => ({
        entityId: product.entityId,
        name: product.name,
        language: product.language,
        extId: product.extId,
        categoryId: product.categoryId,
        description: product.description,
        auctionPriceAmount: product.auctionPriceAmount,
        auctionPriceCurrency: product.auctionPriceCurrency,
        buyNowPriceAmount: product.buyNowPriceAmount,
        buyNowPriceCurrency: product.buyNowPriceCurrency,
        quantity: product.quantity,
        quantityUnit: product.quantityUnit,
        startingAt: product.startingAt,
        duration: product.duration,
        reexposeType: product.reexposeType,
        location: product.location,
        shippingTemplateId: product.shippingTemplateId,
        shippingPayer: product.shippingPayer,
        images: product.images,
        bestOffer: product.bestOffer,
        onlyVerifiedBuyersEnabledOverride: product.onlyVerifiedBuyersEnabledOverride,
        attributes: product.attributes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    try {
        updateStatus("⏳ NAHRÁVÁM EXCEL NA SERVER...");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const file = new File([blob], `products_${Date.now()}.xlsx`, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        const excelUrl = await uploadFile(file);

        navigator.clipboard.writeText(excelUrl).then(() => {
            updateStatus("✅ ODKAZ ZKOPÍROVÁN DO SCHRÁNKY!");
        }).catch(err => {
            updateStatus("❌ CHYBA PŘI KOPÍROVÁNÍ ODKAZU: " + err);
        });

        const whatsappUrl = `whatsapp://send?text=Zde je vygenerovaný Excel soubor: ${encodeURIComponent(excelUrl)}`;
        window.location.href = whatsappUrl;

        savedProductsDiv.innerHTML = "<p>Soubor byl nahrán a odkaz zkopírován. Otevři WhatsApp a odešli zprávu.</p>";
    } catch (error) {
        updateStatus(`❌ CHYBA PŘI NAHRÁVÁNÍ EXCELU: ${error.message}`);
    }
}

// Resetování localStorage
async function resetStorage() {
    const confirmed = await showConfirmModal();
    if (!confirmed) return;

    localStorage.clear();
    photos = [];
    selectedShop = null;
    photoCount.textContent = "0/3";
    document.getElementById("product-name").value = "";
    document.getElementById("product-price").value = "";
    document.getElementById("product-location").value = "";
    categoryIdInput.value = "";
    categoryBtn.textContent = "🔍 Vybrat kategorii";
    productDetails.classList.add("hidden");
    photoSectionSection.classList.add("hidden");
    categorySelection.classList.add("hidden");
    finishSection.classList.add("hidden");
    shopSelectionSection.classList.remove("hidden");
    takePhotoBtn.disabled = false;
    progressBar.classList.add("hidden");
    progress.style.width = "0%";
    document.getElementById("saved-products").innerHTML = "";
    updateStatus("🧹 DATA BYLA VYMAZÁNA! ZAČNI ZNOVU.");
    updateTodayProductCount();
}

// Navigace mezi kroky s validací
const steps = [
    document.getElementById("shop-selection"),
    document.getElementById("photo-section"),
    document.getElementById("product-details"),
    document.getElementById("category-selection"),
    document.getElementById("finish-section")
];

function showStep(stepIndex) {
    steps.forEach((step, index) => {
        step.classList.toggle("hidden", index !== stepIndex);
    });
    updateStatus(`👉 PŘEPNUTO NA KROK ${stepIndex + 1}`);
}

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const currentStep = parseInt(btn.dataset.step);
        const isNext = btn.classList.contains("next-btn");
        const newStep = isNext ? currentStep + 1 : currentStep - 1;

        if (newStep >= 0 && newStep < steps.length) {
            if (currentStep === 1 && isNext && photos.length < 3) {
                updateStatus("⚠️ MUSÍŠ NAFOŤ 3 FOTKY NEŽ PŘEJDEŠ DÁL!");
                return;
            }

            if (currentStep === 2 && isNext) {
                const name = document.getElementById("product-name").value;
                const price = document.getElementById("product-price").value;
                if (!name || !price) {
                    updateStatus("⚠️ VYPLŇ NÁZEV A CENU NEŽ PŘEJDEŠ DÁL!");
                    return;
                }
            }

            if (currentStep === 3 && isNext) {
                const categoryId = categoryIdInput.value;
                if (!categoryId) {
                    updateStatus("⚠️ VYBER KATEGORII NEŽ PŘEJDEŠ DÁL!");
                    return;
                }
            }

            showStep(newStep);
        }
    });
});

// Ovládání dialogu při opuštění stránky
const exitModal = document.getElementById("exit-modal");
const deleteDataBtn = document.getElementById("delete-data-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

window.addEventListener("beforeunload", (e) => {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    if (products.length > 0) {
        exitModal.classList.remove("hidden");
        e.preventDefault();
        e.returnValue = "";
    }
});

deleteDataBtn.addEventListener("click", () => {
    resetStorage();
    exitModal.classList.add("hidden");
    updateStatus("🧹 DATA VYMAZÁNA PŘI ODCHODU!");
    setTimeout(() => window.location.reload(), 1000);
});

closeModalBtn.addEventListener("click", () => {
    exitModal.classList.add("hidden");
});

// Propojení tlačítek s funkcemi
finishBtn.addEventListener("click", finish);
resetBtn.addEventListener("click", resetStorage);
