/* ---------------------------------
   Základní konfigurace
-----------------------------------*/
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/drrzl7evt/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "AKR_Preset";

/* ---------------------------------
   Proměnné
-----------------------------------*/
let photos = [];
let selectedShop = null;
let categories = [];

/* ---------------------------------
   DOM prvky
-----------------------------------*/
const shopZvoleBtn = document.getElementById("shop-zvole");
const shopMoraBtn = document.getElementById("shop-mora");
const photoInput = document.getElementById("photo-input");
const takePhotoBtn = document.getElementById("take-photo-btn");
const photoCountElem = document.getElementById("photo-count");
const statusElem = document.getElementById("status");
const dailyCountElem = document.getElementById("daily-count");

const shopSelectionSection = document.getElementById("shop-selection");
const photoSectionSection = document.getElementById("photo-section");
const productDetailsSection = document.getElementById("product-details");
const finishSection = document.getElementById("finish-section");

const categoryBtn = document.getElementById("category-btn");
const categoryBtnText = document.getElementById("category-btn-text");
const categoryIdInput = document.getElementById("category-id");
const categoryModal = document.getElementById("category-modal");
const categorySearch = document.getElementById("category-search");
const categoryList = document.getElementById("category-list");
const categoryCloseBtn = document.getElementById("category-close-btn");

const progressBar = document.getElementById("progress-bar");

const confirmModal = document.getElementById("confirm-modal");
const confirmYesBtn = document.getElementById("confirm-yes");
const confirmNoBtn = document.getElementById("confirm-no");

const finishBtn = document.getElementById("finish-btn");
const resetBtn = document.getElementById("reset-btn");

const exitModal = document.getElementById("exit-modal");
const deleteDataBtn = document.getElementById("delete-data-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

const shippingMethodSelect = document.getElementById("shippingMethod");

/* ---------------------------------
   Načtení kategorií (MapaKat.txt)
-----------------------------------*/
fetch("MapaKat.txt")
  .then((response) => response.text())
  .then((text) => {
    categories = text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const match = line.match(/(.*)\((\d+)\)/);
        return match
          ? { name: match[1].trim(), id: parseInt(match[2]) }
          : null;
      })
      .filter((cat) => cat);
  })
  .catch((err) => {
    console.error("Chyba při načítání kategorií:", err);
  });

/* ---------------------------------
   Pomocné funkce
-----------------------------------*/
function updateStatus(message) {
  statusElem.textContent = message;
  // Kdykoli změníme status, zaktualizujeme i "dnes přidáno"
  updateDailyCountDisplay();
}

// Vrátí YYYY-MM-DD
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Aktualizace denního počtu přidaných produktů
function updateDailyCountDisplay() {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const todayStr = getTodayDateString();
  let dailyCount = 0;
  products.forEach((p) => {
    if (p.dateAdded === todayStr) {
      dailyCount++;
    }
  });
  dailyCountElem.textContent = `(Dnes přidáno: ${dailyCount} produktů)`;
}

// Zobrazí historii umístění
function updateLocationHistory() {
  const locationHistoryDiv = document.getElementById("location-history");
  const locations = JSON.parse(localStorage.getItem("locationHistory")) || [];
  if (locations.length === 0) {
    locationHistoryDiv.textContent = "Žádná historie umístění.";
  } else {
    const items = locations
      .map(
        (loc) =>
          `<span class="has-text-link" style="cursor:pointer" onclick="document.getElementById('product-location').value='${loc}'">${loc}</span>`
      )
      .join(", ");
    locationHistoryDiv.innerHTML = "Historie: " + items;
  }
}

// Zobrazení Bulma modálu
function openModal(modalElem) {
  modalElem.classList.add("is-active");
}
// Zavření Bulma modálu
function closeModal(modalElem) {
  modalElem.classList.remove("is-active");
}

/* ---------------------------------
   Inicializace
-----------------------------------*/
updateStatus("👉 Začni výběrem obchodu");
updateDailyCountDisplay();

/* ---------------------------------
   Výběr obchodu
-----------------------------------*/
shopZvoleBtn.addEventListener("click", () => {
  selectedShop = "Z";
  shopSelectionSection.classList.add("is-hidden");
  photoSectionSection.classList.remove("is-hidden");
  updateStatus("👉 Vybral jsi Antik Zvole. Nahoď první fotku!");
});

shopMoraBtn.addEventListener("click", () => {
  selectedShop = "M";
  shopSelectionSection.classList.add("is-hidden");
  photoSectionSection.classList.remove("is-hidden");
  updateStatus("👉 Vybral jsi Antik Mora. Nahoď první fotku!");
});

/* ---------------------------------
   Focení 3 fotek
-----------------------------------*/
takePhotoBtn.addEventListener("click", () => {
  if (photos.length < 3) {
    photoInput.click();
  } else {
    updateStatus("✅ Máš už 3 fotky! Vyplň název a cenu.");
  }
});

photoInput.addEventListener("change", () => {
  if (photoInput.files.length) {
    photos.push(photoInput.files[0]);
    photoCountElem.textContent = `${photos.length}/3`;
    photoInput.value = "";
    updateStatus(
      `📸 Nafocena fotka ${photos.length}/3. ${
        photos.length < 3
          ? "Pokračuj další fotkou."
          : "Vyplň název a cenu."
      }`
    );
    if (photos.length === 3) {
      photoSectionSection.classList.add("is-hidden");
      productDetailsSection.classList.remove("is-hidden");
      takePhotoBtn.disabled = true;
      updateLocationHistory();
    }
  }
});

/* ---------------------------------
   Výběr kategorie
-----------------------------------*/
categoryBtn.addEventListener("click", () => {
  openModal(categoryModal);
  categorySearch.value = "";
  updateCategoryList("");
});

categorySearch.addEventListener("input", () => {
  const query = categorySearch.value.toLowerCase().trim();
  updateCategoryList(query);
});

function updateCategoryList(query) {
  categoryList.innerHTML = "";
  const filtered = categories
    .filter((cat) => cat.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const aIndex = a.name.toLowerCase().indexOf(query);
      const bIndex = b.name.toLowerCase().indexOf(query);
      return aIndex - bIndex || a.name.localeCompare(b.name);
    });

  if (filtered.length === 0) {
    const noResult = document.createElement("p");
    noResult.classList.add("has-text-grey");
    noResult.innerText = "Žádné kategorie nenalezeny.";
    categoryList.appendChild(noResult);
    return;
  }

  filtered.forEach((cat) => {
    const btn = document.createElement("button");
    btn.innerHTML = cat.name;
    btn.style.width = "100%";
    btn.style.textAlign = "left";
    btn.style.border = "none";
    btn.style.background = "none";
    btn.style.padding = "0.75rem";
    btn.onmouseover = () => (btn.style.backgroundColor = "#f2f2f2");
    btn.onmouseout = () => (btn.style.backgroundColor = "");
    btn.onclick = () => {
      categoryIdInput.value = cat.id;
      // Požadavek: zobrazit jen text "VYBRÁNO"
      categoryBtnText.textContent = "VYBRÁNO";
      updateStatus("✅ Kategorie vybrána!");
      closeModal(categoryModal);
    };
    categoryList.appendChild(btn);
  });
}

categoryCloseBtn.addEventListener("click", () => {
  closeModal(categoryModal);
});

/* ---------------------------------
   Upload souboru na Cloudinary
-----------------------------------*/
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "media_library");

  const resp = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Chyba při nahrávání: ${resp.status} - ${errorText}`);
  }
  const data = await resp.json();
  return data.secure_url;
}

/* ---------------------------------
   Přidání produktu
-----------------------------------*/
async function addProduct() {
  const name = document.getElementById("product-name").value.trim();
  const price = document.getElementById("product-price").value.trim();
  const categoryId = categoryIdInput.value.trim();
  const location = document.getElementById("product-location").value.trim();
  const shippingId = shippingMethodSelect.value;

  if (!name || !price || !categoryId || !shippingId) {
    updateStatus(
      "⚠️ Vyplň název, cenu, kategorii a dopravu!"
    );
    return;
  }

  updateStatus("⏳ Zpracovávám a nahrávám fotky...");
  progressBar.classList.remove("is-hidden");
  progressBar.value = 0;

  try {
    const photoUrls = [];
    for (let i = 0; i < photos.length; i++) {
      updateStatus(`🖼️ Nahrávám obrázek ${i + 1}/3...`);
      const url = await uploadFile(photos[i]);
      photoUrls.push(url);
      const percent = Math.round(((i + 1) / photos.length) * 100);
      progressBar.value = percent;
      updateStatus(`📤 Nahrán obrázek ${i + 1}/3...`);
    }

    // Uložení umístění do localStorage
    if (location) {
      let locationHistory = JSON.parse(localStorage.getItem("locationHistory")) || [];
      if (!locationHistory.includes(location)) {
        locationHistory.push(location);
        localStorage.setItem("locationHistory", JSON.stringify(locationHistory));
      }
    }

    // Generování entityId
    let lastEntityId = parseInt(localStorage.getItem("lastEntityId")) || 0;
    lastEntityId += 1;
    localStorage.setItem("lastEntityId", lastEntityId);

    function getRoundedISODate() {
      let d = new Date();
      d.setUTCMinutes(0, 0, 0);
      d.setUTCHours(d.getUTCHours() + 1);
      return d.toISOString().replace(".000Z", "Z");
    }

    const productDescription = `<div><h3><strong>🛒 NABÍZENÉ ZBOŽÍ 🎁</strong></h3><p>Stav viz. fotografie 📸</p><p><strong>Pro dotazy preferuji komunikaci e-mailem.</strong></p></div>`;

    const formattedName = `${name.toUpperCase()} | [${selectedShop}]`;
    const todayStr = getTodayDateString();

    const product = {
      entityId: lastEntityId,
      name: formattedName,
      language: "cs-CZ",
      extId: location,
      categoryId: parseInt(categoryId),
      description: productDescription,
      auctionPriceAmount: parseInt(price),
      auctionPriceCurrency: "CZK",
      buyNowPriceAmount: 0,
      buyNowPriceCurrency: "CZK",
      quantity: 1,
      quantityUnit: "pieces",
      startingAt: getRoundedISODate(),
      duration: 7,
      reexposeType: 0,
      location: JSON.stringify({
        countryCode: "CZ",
        postCode: "789 01",
        city: "Zvole"
      }),
      shippingTemplateId: parseInt(shippingId),
      shippingPayer: "buyer",
      images: photoUrls.join(" "),
      bestOffer: 1,
      onlyVerifiedBuyersEnabledOverride: 0,
      attributes: JSON.stringify(),
      dateAdded: todayStr
    };

    let products = JSON.parse(localStorage.getItem("products")) || [];
    products.push(product);
    localStorage.setItem("products", JSON.stringify(products));

    // Reset
    photos = [];
    photoCountElem.textContent = "0/3";
    document.getElementById("product-name").value = "";
    document.getElementById("product-price").value = "";
    document.getElementById("product-location").value = "";
    categoryIdInput.value = "";
    categoryBtnText.textContent = "Vybrat kategorii";
    shippingMethodSelect.value = "";

    productDetailsSection.classList.add("is-hidden");
    finishSection.classList.remove("is-hidden");
    takePhotoBtn.disabled = false;

    updateStatus("🎉 Produkt přidán! Můžeš dokončit nebo přidat další.");
  } catch (error) {
    updateStatus(`❌ Chyba při nahrávání fotek: ${error.message}`);
  }
}

/* ---------------------------------
   Přidat další produkt
-----------------------------------*/
function addAnotherProduct() {
  // Reset progress bar pro nový produkt
  progressBar.value = 0;
  progressBar.classList.add("is-hidden");

  finishSection.classList.add("is-hidden");
  photoSectionSection.classList.remove("is-hidden");
  updateStatus("👉 Nafoť fotky pro další produkt.");
}

/* ---------------------------------
   Dokončení – export do Excelu, WhatsApp
-----------------------------------*/
async function finish() {
  const confirmed = await showConfirmModal();
  if (!confirmed) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];
  const savedProductsDiv = document.getElementById("saved-products");
  savedProductsDiv.innerHTML = "";

  if (products.length === 0) {
    savedProductsDiv.innerHTML = "<p>Žádné produkty nebyly přidány. 😕</p>";
    updateStatus("⚠️ Přidej aspoň jeden produkt před dokončením.");
    return;
  }

  const headers = [
    "entityId",
    "name",
    "language",
    "extId",
    "categoryId",
    "description",
    "auctionPriceAmount",
    "auctionPriceCurrency",
    "buyNowPriceAmount",
    "buyNowPriceCurrency",
    "quantity",
    "quantityUnit",
    "startingAt",
    "duration",
    "reexposeType",
    "location",
    "shippingTemplateId",
    "shippingPayer",
    "images",
    "bestOffer",
    "onlyVerifiedBuyersEnabledOverride",
    "attributes"
  ];

  const data = products.map((p) => ({
    entityId: p.entityId,
    name: p.name,
    language: p.language,
    extId: p.extId,
    categoryId: p.categoryId,
    description: p.description,
    auctionPriceAmount: p.auctionPriceAmount,
    auctionPriceCurrency: p.auctionPriceCurrency,
    buyNowPriceAmount: p.buyNowPriceAmount,
    buyNowPriceCurrency: p.buyNowPriceCurrency,
    quantity: p.quantity,
    quantityUnit: p.quantityUnit,
    startingAt: p.startingAt,
    duration: p.duration,
    reexposeType: p.reexposeType,
    location: p.location,
    shippingTemplateId: p.shippingTemplateId,
    shippingPayer: p.shippingPayer,
    images: p.images,
    bestOffer: p.bestOffer,
    onlyVerifiedBuyersEnabledOverride: p.onlyVerifiedBuyersEnabledOverride,
    attributes: p.attributes
  }));

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  try {
    updateStatus("⏳ Nahrávám Excel na server...");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const file = new File(
      [blob],
      `products_${Date.now()}.xlsx`,
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    );

    const excelUrl = await uploadFile(file);

    // Zkopírování odkazu do schránky
    navigator.clipboard.writeText(excelUrl).then(
      () => {
        updateStatus("✅ Odkaz zkopírován do schránky!");
      },
      (err) => {
        updateStatus("❌ Chyba při kopírování odkazu: " + err);
      }
    );

    // Otevření WhatsApp
    const whatsappUrl = `whatsapp://send?text=Zde je vygenerovaný Excel soubor: ${encodeURIComponent(excelUrl)}`;
    window.location.href = whatsappUrl;

    savedProductsDiv.innerHTML =
      "<p>Soubor byl nahrán a odkaz zkopírován. Otevři WhatsApp a odešli zprávu.</p>";
  } catch (error) {
    updateStatus(`❌ Chyba při nahrávání Excelu: ${error.message}`);
  }
}

/* ---------------------------------
   Reset úložiště
-----------------------------------*/
async function resetStorage() {
  const confirmed = await showConfirmModal();
  if (!confirmed) return;

  localStorage.clear();
  photos = [];
  selectedShop = null;
  photoCountElem.textContent = "0/3";
  document.getElementById("product-name").value = "";
  document.getElementById("product-price").value = "";
  document.getElementById("product-location").value = "";
  categoryIdInput.value = "";
  categoryBtnText.textContent = "Vybrat kategorii";
  shippingMethodSelect.value = "";
  progressBar.value = 0;
  progressBar.classList.add("is-hidden");

  productDetailsSection.classList.add("is-hidden");
  photoSectionSection.classList.add("is-hidden");
  finishSection.classList.add("is-hidden");
  shopSelectionSection.classList.remove("is-hidden");
  takePhotoBtn.disabled = false;
  document.getElementById("saved-products").innerHTML = "";

  updateStatus("🧹 Data byla vymazána! Začni znovu.");
}

/* ---------------------------------
   Navigace mezi kroky
-----------------------------------*/
const steps = [
  shopSelectionSection,
  photoSectionSection,
  productDetailsSection,
  finishSection
];

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const currentStep = parseInt(btn.dataset.step, 10);
    const isNext = btn.classList.contains("next-btn");
    const newStep = isNext ? currentStep + 1 : currentStep - 1;

    if (newStep >= 0 && newStep < steps.length) {
      // Kontrola 3 fotek
      if (currentStep === 1 && isNext && photos.length < 3) {
        updateStatus("⚠️ Musíš nafotit 3 fotky, než přejdeš dál!");
        return;
      }
      // Kontrola vyplnění
      if (currentStep === 2 && isNext) {
        const name = document.getElementById("product-name").value.trim();
        const price = document.getElementById("product-price").value.trim();
        const categoryId = categoryIdInput.value.trim();
        const shippingId = shippingMethodSelect.value;
        if (!name || !price || !categoryId || !shippingId) {
          updateStatus(
            "⚠️ Vyplň název, cenu, kategorii a dopravu, než přejdeš dál!"
          );
          return;
        }
      }

      steps[currentStep].classList.add("is-hidden");
      steps[newStep].classList.remove("is-hidden");
      updateStatus(`👉 Přepnuto na krok č. ${newStep + 1}`);
    }
  });
});

/* ---------------------------------
   Potvrzovací modál ANO/NE
-----------------------------------*/
function showConfirmModal() {
  openModal(confirmModal);
  return new Promise((resolve) => {
    confirmYesBtn.onclick = () => {
      closeModal(confirmModal);
      resolve(true);
    };
    confirmNoBtn.onclick = () => {
      closeModal(confirmModal);
      resolve(false);
    };
  });
}

/* ---------------------------------
   Modál pro odchod
-----------------------------------*/
window.addEventListener("beforeunload", (e) => {
  openModal(exitModal);
  e.preventDefault();
  e.returnValue = "";
});

deleteDataBtn.addEventListener("click", () => {
  resetStorage();
  closeModal(exitModal);
  updateStatus("🧹 Data vymazána při odchodu!");
  setTimeout(() => window.location.reload(), 1000);
});

closeModalBtn.addEventListener("click", () => {
  closeModal(exitModal);
});

/* ---------------------------------
   Propojení tlačítek
-----------------------------------*/
finishBtn.addEventListener("click", finish);
resetBtn.addEventListener("click", resetStorage);
