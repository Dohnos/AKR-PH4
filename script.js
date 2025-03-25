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
const status = document.getElementById("status");
const progressBar = document.getElementById("progress-bar");
const progress = document.getElementById("progress");
const productsToday = document.getElementById("products-today");
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
        categories = text.split("\n")
            .filter(line => line.trim())
            .map(line => {
                const match = line.match(/(.*)\((\d+)\)/);
                return match ? { name: match[1].trim(), id: parseInt(match[2]) } : null;
            })
            .filter(category => category);
    })
    .catch(error => console.error("Chyba při načítání kategorií:", error));

function updateStatus(message) {
    status.textContent = message;
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

// Funkce pro aktualizaci počítadla produktů za dnešní den
function updateProductsToday() {
    const today = new Date().toISOString().split("T")[0]; // Formát YYYY-MM-DD
    const key = `productsAdded_${today}`;
    const count = parseInt(localStorage.getItem(key)) || 0;
    productsToday.textContent = `Přidáno produktů dnes: ${count}`;
}

// Funkce pro uložení stavu do localStorage
function saveState() {
    const state = {
        selectedShop,
        photosCount: photos.length,
        currentStep: steps.findIndex(step => !step.classList.contains("hidden")),
        productName: document.getElementById("product-name").value,
        productPrice: document.getElementById("product-price").value,
        productLocation: document.getElementById("product-location").value,
        categoryId: categoryIdInput.value,
        categoryName: categoryBtn.textContent,
        shippingMethod: document.getElementById("shipping-method").value
    };
    localStorage.setItem("appState", JSON.stringify(state));
}

// Funkce pro obnovení stavu z localStorage
function restoreState() {
    const state = JSON.parse(localStorage.getItem("appState"));
    if (!state) return;

    selectedShop = state.selectedShop;
    photos = Array(state.photosCount).fill(null); // Nemůžeme uložit soubory, ale obnovíme počet
    photoCount.textContent = `${state.photosCount}/3`;

    if (state.selectedShop) {
        shopSelectionSection.classList.add("hidden");
        if (state.currentStep >= 1) {
            photoSectionSection.classList.remove("hidden");
        }
    }

    if (state.photosCount === 3) {
        photoSectionSection.classList.add("hidden");
        productDetails.classList.remove("hidden");
        takePhotoBtn.disabled = true;
        updateLocationHistory();
    }

    if (state.currentStep >= 2) {
        document.getElementById("product-name").value = state.productName || "";
        document.getElementById("product-price").value = state.productPrice || "";
        document.getElementById("product-location").value = state.productLocation || "";
        categoryIdInput.value = state.categoryId || "";
        categoryBtn.textContent = state.categoryName || "🔍 Vybrat kategorii";
    }

    if (state.currentStep >= 3) {
        productDetails.classList.add("hidden");
        finishSection.classList.remove("hidden");
    }

    if (state.shippingMethod) {
        document.getElementById("shipping-method").value = state.shippingMethod;
    }

    showStep(state.currentStep || 0);
    updateStatus("👉 STAV OBNOVEN Z PŘEDCHOZÍHO KROKU.");
}

// Inicializace
updateStatus("👉 ZAČNI VÝBĚREM OBCHODU");
updateProductsToday();
productsToday.classList.remove("hidden"); // Zobrazí počítadlo hned od začátku
restoreState();

// Výběr obchodu
shopZvoleBtn.addEventListener("click", () => {
    selectedShop = "Z";
    shopSelectionSection.classList.add("hidden");
    photoSectionSection.classList.remove("hidden");
    updateStatus("👉 VYBRAL JSI ANTIK ZVOLE. NAFOŤ PRVNÍ FOTKU.");
    productsToday.classList.remove("hidden");
    saveState();
});

shopMoraBtn.addEventListener("click", () => {
    selectedShop = "M";
    shopSelectionSection.classList.add("hidden");
    photoSectionSection.classList.remove("hidden");
    updateStatus("👉 VYBRAL JSI ANTIK MORA. NAFOŤ PRVNÍ FOTKU.");
    productsToday.classList.remove("hidden");
    saveState();
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
        saveState();
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
        btn.textContent = category.name;
        btn.dataset.id = category.id;
        btn.addEventListener("click", () => {
            categoryIdInput.value = category.id;
            categoryBtn.textContent = `Vybrána kategorie: ${category.name}`;
            categoryModal.classList.add("hidden");
            updateStatus("✅ KATEGORIE VYBRÁNA!");
            saveState();
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

// Uložení stavu při změně formuláře
document.getElementById("product-name").addEventListener("input", saveState);
document.getElementById("product-price").addEventListener("input", saveState);
document.getElementById("product-location").addEventListener("input", saveState);
document.getElementById("shipping-method").addEventListener("change", saveState);

// Nahrání souboru na Cloudinary s transformacemi
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

        // Uložení umístění do localStorage
        if (location) {
            let locationHistory = JSON.parse(localStorage.getItem("locationHistory")) || [];
            if (!locationHistory.includes(location)) {
                locationHistory.push(location);
                localStorage.setItem("locationHistory", JSON.stringify(locationHistory));
            }
        }

        // Zvýšení počítadla produktů za dnešní den
        const today = new Date().toISOString().split("T")[0];
        const key = `productsAdded_${today}`;
        let count = parseInt(localStorage.getItem(key)) || 0;
        count += 1;
        localStorage.setItem(key, count);
        updateProductsToday();

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
            attributes: JSON.stringify([])
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
        document.getElementById("shipping-method").value = "2424163";
        productDetails.classList.add("hidden");
        finishSection.classList.remove("hidden");
        takePhotoBtn.disabled = false;

        updateStatus("🎉 PRODUKT PŘIDÁN! MŮŽEŠ DOKONČIT NEBO PŘIDAT DALŠÍ.");
        productsToday.classList.add("hidden"); // Skryje počítadlo ve 4. kroku
        saveState();
    } catch (error) {
        updateStatus(`❌ CHYBA PŘI ZPRACOVÁNÍ NEBO NAHRÁVÁNÍ FOTEK: ${error.message}`);
    }
}

// Funkce pro přidání dalšího produktu
function addAnotherProduct() {
    finishSection.classList.add("hidden");
    photoSectionSection.classList.remove("hidden");
    updateStatus("👉 NAFOŤ FOTKY PRO DALŠÍ PRODUKT.");
    productsToday.classList.remove("hidden"); // Zobrazí počítadlo při návratu na krok 2
    saveState();
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
    document.getElementById("shipping-method").value = "2424163";
    productDetails.classList.add("hidden");
    photoSectionSection.classList.add("hidden");
    finishSection.classList.add("hidden");
    shopSelectionSection.classList.remove("hidden");
    takePhotoBtn.disabled = false;
    progressBar.classList.add("hidden");
    progress.style.width = "0%";
    document.getElementById("saved-products").innerHTML = "";
    updateStatus("🧹 DATA BYLA VYMAZÁNA! ZAČNI ZNOVU.");
    productsToday.classList.remove("hidden");
    updateProductsToday();
    saveState();
}

// Navigace mezi kroky s validací
const steps = [
    document.getElementById("shop-selection"),
    document.getElementById("photo-section"),
    document.getElementById("product-details"),
    document.getElementById("finish-section")
];

function showStep(stepIndex) {
    steps.forEach((step, index) => {
        step.classList.toggle("hidden", index !== stepIndex);
    });
    // Zobrazení/skrytí počítadla podle kroku
    if (stepIndex >= 0 && stepIndex <= 2) {
        productsToday.classList.remove("hidden");
    } else {
        productsToday.classList.add("hidden");
    }
    updateStatus(`👉 PŘEPNUTO NA KROK ${stepIndex + 1}`);
    saveState();
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
                const categoryId = categoryIdInput.value;
                if (!name || !price || !categoryId) {
                    updateStatus("⚠️ VYPLŇ NÁZEV, CENU A KATEGORII NEŽ PŘEJDEŠ DÁL!");
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
    exitModal.classList.remove("hidden");
    e.preventDefault();
    e.returnValue = "";
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
