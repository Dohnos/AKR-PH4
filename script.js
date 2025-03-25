// Konfigurace Cloudinary
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/drrzl7evt/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "AKR_Preset";

// Proměnné v paměti
let photos = [];
let selectedShop = null;
let categories = [];

/* ------------------------
   DOM prvky
-------------------------*/
const shopZvoleBtn = document.getElementById("shop-zvole");
const shopMoraBtn = document.getElementById("shop-mora");
const photoInput = document.getElementById("photo-input");
const takePhotoBtn = document.getElementById("take-photo-btn");
const photoCountElem = document.getElementById("photo-count");
const statusElem = document.getElementById("status");
const dailyCountElem = document.getElementById("daily-count");

const progressBar = document.getElementById("progress-bar");
const progress = document.getElementById("progress");

const shopSelectionSection = document.getElementById("shop-selection");
const photoSectionSection = document.getElementById("photo-section");
const productDetailsSection = document.getElementById("product-details");
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

const shippingMethodSelect = document.getElementById("shippingMethod");

/* ------------------------
   Načtení kategorií (MapaKat.txt)
-------------------------*/
fetch("MapaKat.txt")
  .then((response) => response.text())
  .then((text) => {
    categories = text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        // např. "Název kategorie(12345)"
        const match = line.match(/(.*)\((\d+)\)/);
        return match
          ? { name: match[1].trim(), id: parseInt(match[2]) }
          : null;
      })
      .filter((cat) => cat);
  })
  .catch((err) => console.error("Chyba při načítání kategorií:", err));

/* ------------------------
   Pomocné funkce
-------------------------*/
function updateStatus(message) {
  statusElem.textContent = message;
  // Zde navíc dole držíme řádek (dnes přidáno: X)
  updateDailyCountDisplay();
}

// Získá datum bez času (YYYY-MM-DD), aby se dala porovnávat jen data
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Zaktualizuje počet přidaných produktů za dnešní den
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
    // Klikací odkazy
    const items = locations
      .map(
        (loc) =>
          `<span class="text-primary text-decoration-underline" style="cursor:pointer" onclick="document.getElementById('product-location').value='${loc}'">${loc}</span>`
      )
      .join(", ");
    locationHistoryDiv.innerHTML = "Historie: " + items;
  }
}

// Modální potvrzení ANO/NE
function showConfirmModal() {
  // Pomocí Bootstrap modalu
  const bsModal = new bootstrap.Modal(confirmModal);
  bsModal.show();

  return new Promise((resolve) => {
    confirmYesBtn.onclick = () => {
      bsModal.hide();
      resolve(true);
    };
    confirmNoBtn.onclick = () => {
      bsModal.hide();
      resolve(false);
    };
  });
}

/* ------------------------
   Inicializace
-------------------------*/
updateStatus("👉 Začni výběrem obchodu");
updateDailyCountDisplay();

/* ------------------------
   Výběr obchodu
-------------------------*/
shopZvoleBtn.addEventListener("click", () => {
  selectedShop = "Z";
  shopSelectionSection.classList.add("d-none");
  photoSectionSection.classList.remove("d-none");
  updateStatus("👉 Vybral jsi Antik Zvole. Nahoď první fotku!");
});

shopMoraBtn.addEventListener("click", () => {
  selectedShop = "M";
  shopSelectionSection.classList.add("d-none");
  photoSectionSection.classList.remove("d-none");
  updateStatus("👉 Vybral jsi Antik Mora. Nahoď první fotku!");
});

/* ------------------------
   Focení (3 fotky)
-------------------------*/
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
      photoSectionSection.classList.add("d-none");
      productDetailsSection.classList.remove("d-none");
      takePhotoBtn.disabled = true;
      updateLocationHistory();
    }
  }
});

/* ------------------------
   Výběr kategorie
-------------------------*/
categoryBtn.addEventListener("click", () => {
  const bsModal = new bootstrap.Modal(categoryModal);
  bsModal.show();
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
      // Seřadí podle pozice query a abecedně
      const aIndex = a.name.toLowerCase().indexOf(query);
      const bIndex = b.name.toLowerCase().indexOf(query);
      return aIndex - bIndex || a.name.localeCompare(b.name);
    });

  if (filtered.length === 0) {
    const p = document.createElement("p");
    p.className = "text-muted";
    p.textContent = "Žádné kategorie nenalezeny.";
    categoryList.appendChild(p);
    return;
  }

  filtered.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "list-group-item list-group-item-action";
    btn.textContent = cat.name;
    btn.dataset.id = cat.id;
    btn.onclick = () => {
      categoryIdInput.value = cat.id;
      categoryBtn.textContent = `Vybraná kategorie: ${cat.name}`;
      updateStatus("✅ Kategorie vybrána!");
      // Schovat modál
      const bsModal = bootstrap.Modal.getInstance(categoryModal);
      bsModal.hide();
    };
    categoryList.appendChild(btn);
  });
}

categoryCloseBtn.addEventListener("click", () => {
  const bsModal = bootstrap.Modal.getInstance(categoryModal);
  bsModal.hide();
});

/* ------------------------
   Nahrání souboru na Cloudinary
-------------------------*/
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  // Obrázky do složky "media_library"
  formData.append("folder", file.type.includes("image") ? "media_library" : "others");

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

/* ------------------------
   Přidání produktu
-------------------------*/
async function addProduct() {
  const name = document.getElementById("product-name").value.trim();
  const price = document.getElementById("product-price").value.trim();
  const categoryId = categoryIdInput.value.trim();
  const location = document.getElementById("product-location").value.trim();
  const shippingId = shippingMethodSelect.value; // Nově vybraná doprava

  if (!name || !price || !categoryId || !shippingId) {
    updateStatus(
      "⚠️ Vyplň název, cenu, kategorii a vyber dopravu!"
    );
    return;
  }

  updateStatus("⏳ Zpracovávám a nahrávám fotky...");
  progressBar.classList.remove("d-none");
  progress.style.width = "0%";

  try {
    const photoUrls = [];
    for (let i = 0; i < photos.length; i++) {
      updateStatus(`🖼️ Nahrávám obrázek ${i + 1}/3...`);
      const url = await uploadFile(photos[i]);
      photoUrls.push(url);
      const percent = Math.round(((i + 1) / photos.length) * 100);
      progress.style.width = `${percent}%`;
      updateStatus(`📤 Nahrán obrázek ${i + 1}/3...`);
    }

    // Uložení umístění do localStorage (historie)
    if (location) {
      let locationHistory = JSON.parse(localStorage.getItem("locationHistory")) || [];
      if (!locationHistory.includes(location)) {
        locationHistory.push(location);
        localStorage.setItem("locationHistory", JSON.stringify(locationHistory));
      }
    }

    // Generujeme unikatni ID v rámci localStorage
    let lastEntityId = parseInt(localStorage.getItem("lastEntityId")) || 0;
    lastEntityId += 1;
    localStorage.setItem("lastEntityId", lastEntityId);

    // Datum (ISO, zaokrouhleno) – pro Aukro
    function getRoundedISODate() {
      let d = new Date();
      d.setUTCMinutes(0, 0, 0);
      d.setUTCHours(d.getUTCHours() + 1);
      return d.toISOString().replace(".000Z", "Z");
    }

    // Základní popis (může zůstat)
    const productDescription = `<div class="aukro-offer-default"><div data-layout="text"><div><h3><strong>🛒 NABÍZENÉ ZBOŽÍ 🎁</strong></h3><p>Stav viz. fotografie 📸</p><p><strong> Pro dotazy k aukcím preferuji komunikaci e-mailem, z důvodu flexibilnějšího a rychlejšího vyřízení požadavku. Přeji Vám příjemnou dražbu! 💌 Podívejte se i na mé další aukce a objevte skvělé nabídky! 🚀</strong></p><p><br></p><h3><strong>⚠️ INFORMACE O AUKCI :</strong></h3><p>Na platby čekám jeden týden od vydražení aukce, zboží <strong>zasílám 7-10 dní po obdržení platby</strong>. Zboží bude znovu vystaveno, zda-li nebude uhrazeno v této lhůtě.</p><p>Berte prosím na vědomí, že vydražené zboží <strong>nezasílám na DOBÍRKU</strong>. Zboží mohu zasílat přes <strong>KURÝRNÍ SLUŽBU (DPD) & také ZÁSILKOVNU</strong>.</p><p><br></p><h3><strong>💳 PLATBA :</strong></h3><p>Platbu můžete uskutečnit pouze <strong>BANKOVNÍM PŘEVODEM</strong>. Číslo bankovního účtu <strong>najdete ve výherním e-mailu</strong>. Děkuji za pochopení. <strong>(Při platbě BANKOVNÍM PŘEVODEM, prosím uvést ČÍSLO NABÍDKY, které je uvedeno u AUKCE)</strong></p></div></div></div>`;

    const formattedName = `${name.toUpperCase()} | [${selectedShop}]`;
    const todayStr = getTodayDateString(); // abychom věděli, že byl přidán dnes

    const product = {
      entityId: lastEntityId,
      name: formattedName,
      language: "cs-CZ",
      extId: location, // Umístění se použije jako extId
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
      shippingTemplateId: parseInt(shippingId), // <--- sem dáme vybranou dopravu
      shippingPayer: "buyer",
      images: photoUrls.join(" "),
      bestOffer: 1,
      onlyVerifiedBuyersEnabledOverride: 0,
      attributes: JSON.stringify({}),
      dateAdded: todayStr // Pro sledování denního počtu
    };

    // Uložení do localStorage
    let products = JSON.parse(localStorage.getItem("products")) || [];
    products.push(product);
    localStorage.setItem("products", JSON.stringify(products));

    // Reset stavu
    photos = [];
    photoCountElem.textContent = "0/3";
    document.getElementById("product-name").value = "";
    document.getElementById("product-price").value = "";
    document.getElementById("product-location").value = "";
    categoryIdInput.value = "";
    categoryBtn.textContent = "🔍 Vybrat kategorii";
    shippingMethodSelect.value = "";

    productDetailsSection.classList.add("d-none");
    finishSection.classList.remove("d-none");
    takePhotoBtn.disabled = false;

    updateStatus("🎉 Produkt přidán! Můžeš dokončit nebo přidat další.");
  } catch (error) {
    updateStatus(`❌ Chyba při zpracování nebo nahrávání fotek: ${error.message}`);
  }
}

/* ------------------------
   Přidat další produkt
-------------------------*/
function addAnotherProduct() {
  finishSection.classList.add("d-none");
  photoSectionSection.classList.remove("d-none");
  updateStatus("👉 Nafoť fotky pro další produkt.");
}

/* ------------------------
   Dokončení – export do Excelu + WhatsApp
-------------------------*/
async function finish() {
  const confirmed = await showConfirmModal();
  if (!confirmed) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];
  const savedProductsDiv = document.getElementById("saved-products");
  savedProductsDiv.innerHTML = "";

  if (products.length === 0) {
    savedProductsDiv.innerHTML =
      "<p>Žádné produkty nebyly přidány. 😕</p>";
    updateStatus("⚠️ Přidej aspoň jeden produkt před dokončením.");
    return;
  }

  // Záhlaví do Excelu
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

  // Převod do JSON pro XLSX
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

    // Upload Excelu
    const excelUrl = await uploadFile(file);

    // Kopie odkazu do schránky
    navigator.clipboard.writeText(excelUrl).then(
      () => {
        updateStatus("✅ Odkaz zkopírován do schránky!");
      },
      (err) => {
        updateStatus("❌ Chyba při kopírování odkazu: " + err);
      }
    );

    // Otevření WhatsApp
    const whatsappUrl = `whatsapp://send?text=Zde je vygenerovaný Excel soubor: ${encodeURIComponent(
      excelUrl
    )}`;
    window.location.href = whatsappUrl;

    savedProductsDiv.innerHTML =
      "<p>Soubor byl nahrán a odkaz zkopírován. Otevři WhatsApp a odešli zprávu.</p>";
  } catch (error) {
    updateStatus(`❌ Chyba při nahrávání Excelu: ${error.message}`);
  }
}

/* ------------------------
   Reset – vymazání dat
-------------------------*/
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
  categoryBtn.textContent = "🔍 Vybrat kategorii";
  shippingMethodSelect.value = "";

  productDetailsSection.classList.add("d-none");
  photoSectionSection.classList.add("d-none");
  finishSection.classList.add("d-none");
  shopSelectionSection.classList.remove("d-none");
  takePhotoBtn.disabled = false;
  progressBar.classList.add("d-none");
  progress.style.width = "0%";
  document.getElementById("saved-products").innerHTML = "";

  updateStatus("🧹 Data byla vymazána! Začni znovu.");
}

/* ------------------------
   Navigace mezi kroky
-------------------------*/
const steps = [
  shopSelectionSection,
  photoSectionSection,
  productDetailsSection,
  finishSection
];

function showStep(stepIndex) {
  steps.forEach((step, index) => {
    step.classList.toggle("d-none", index !== stepIndex);
  });
  updateStatus(`👉 Přepnuto na krok č. ${stepIndex + 1}`);
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const currentStep = parseInt(btn.dataset.step, 10);
    const isNext = btn.classList.contains("next-btn");
    const newStep = isNext ? currentStep + 1 : currentStep - 1;

    if (newStep >= 0 && newStep < steps.length) {
      // Kontrola pro 3 fotky
      if (currentStep === 1 && isNext && photos.length < 3) {
        updateStatus("⚠️ Musíš nafotit 3 fotky, než přejdeš dál!");
        return;
      }
      // Kontrola pro název, cenu, kategorii + dopravu
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

      showStep(newStep);
    }
  });
});

/* ------------------------
   Kontrola při odchodu
-------------------------*/
const exitModal = document.getElementById("exit-modal");
const deleteDataBtn = document.getElementById("delete-data-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

// Při pokusu o reload/odchod – zobraz modální okno
window.addEventListener("beforeunload", (e) => {
  const bsModal = new bootstrap.Modal(exitModal);
  bsModal.show();
  e.preventDefault();
  e.returnValue = "";
});

deleteDataBtn.addEventListener("click", () => {
  resetStorage();
  const bsModal = bootstrap.Modal.getInstance(exitModal);
  bsModal.hide();
  updateStatus("🧹 Data vymazána při odchodu!");
  setTimeout(() => {
    window.location.reload();
  }, 1000);
});

closeModalBtn.addEventListener("click", () => {
  const bsModal = bootstrap.Modal.getInstance(exitModal);
  bsModal.hide();
});

// Propojení tlačítek s funkcemi
finishBtn.addEventListener("click", finish);
resetBtn.addEventListener("click", resetStorage);
