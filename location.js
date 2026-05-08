// public/js/location.js — location picker modal with D3 world map

const LOCATIONS_RAW = [
  // East Asia
  ['Seoul','Republic of Korea','🇰🇷',37.57,126.98],
  ['Busan','Republic of Korea','🇰🇷',35.18,129.08],
  ['Incheon','Republic of Korea','🇰🇷',37.46,126.71],
  ['Daegu','Republic of Korea','🇰🇷',35.87,128.60],
  ['Daejeon','Republic of Korea','🇰🇷',36.35,127.38],
  ['Gwangju','Republic of Korea','🇰🇷',35.16,126.85],
  ['Jeju','Republic of Korea','🇰🇷',33.50,126.53],
  ['Tokyo','Japan','🇯🇵',35.68,139.69],
  ['Osaka','Japan','🇯🇵',34.69,135.50],
  ['Kyoto','Japan','🇯🇵',35.01,135.77],
  ['Yokohama','Japan','🇯🇵',35.44,139.64],
  ['Sapporo','Japan','🇯🇵',43.06,141.35],
  ['Fukuoka','Japan','🇯🇵',33.59,130.40],
  ['Nagoya','Japan','🇯🇵',35.18,136.91],
  ['Beijing','China','🇨🇳',39.90,116.41],
  ['Shanghai','China','🇨🇳',31.23,121.47],
  ['Guangzhou','China','🇨🇳',23.13,113.26],
  ['Shenzhen','China','🇨🇳',22.54,114.06],
  ['Chengdu','China','🇨🇳',30.57,104.07],
  ["Xi'an",'China','🇨🇳',34.34,108.94],
  ['Hangzhou','China','🇨🇳',30.27,120.15],
  ['Hong Kong','China','🇨🇳',22.32,114.17],
  ['Macau','China','🇲🇴',22.20,113.54],
  ['Taipei','Taiwan','🇹🇼',25.03,121.57],
  ['Kaohsiung','Taiwan','🇹🇼',22.63,120.30],
  ['Ulaanbaatar','Mongolia','🇲🇳',47.92,106.92],
  // Southeast Asia
  ['Singapore','Singapore','🇸🇬',1.35,103.82],
  ['Kuala Lumpur','Malaysia','🇲🇾',3.14,101.69],
  ['Bangkok','Thailand','🇹🇭',13.76,100.50],
  ['Chiang Mai','Thailand','🇹🇭',18.79,98.99],
  ['Hanoi','Vietnam','🇻🇳',21.03,105.85],
  ['Ho Chi Minh City','Vietnam','🇻🇳',10.82,106.63],
  ['Manila','Philippines','🇵🇭',14.60,120.98],
  ['Cebu','Philippines','🇵🇭',10.32,123.89],
  ['Jakarta','Indonesia','🇮🇩',-6.21,106.85],
  ['Bali','Indonesia','🇮🇩',-8.41,115.19],
  ['Yogyakarta','Indonesia','🇮🇩',-7.80,110.37],
  ['Phnom Penh','Cambodia','🇰🇭',11.56,104.92],
  ['Vientiane','Laos','🇱🇦',17.97,102.61],
  ['Yangon','Myanmar','🇲🇲',16.87,96.20],
  // South Asia
  ['Mumbai','India','🇮🇳',19.08,72.88],
  ['Delhi','India','🇮🇳',28.61,77.21],
  ['Bangalore','India','🇮🇳',12.97,77.59],
  ['Chennai','India','🇮🇳',13.08,80.27],
  ['Kolkata','India','🇮🇳',22.57,88.36],
  ['Hyderabad','India','🇮🇳',17.39,78.49],
  ['Pune','India','🇮🇳',18.52,73.86],
  ['Karachi','Pakistan','🇵🇰',24.86,67.01],
  ['Lahore','Pakistan','🇵🇰',31.55,74.34],
  ['Islamabad','Pakistan','🇵🇰',33.68,73.05],
  ['Dhaka','Bangladesh','🇧🇩',23.81,90.41],
  ['Kathmandu','Nepal','🇳🇵',27.71,85.32],
  ['Colombo','Sri Lanka','🇱🇰',6.93,79.86],
  // Middle East
  ['Dubai','United Arab Emirates','🇦🇪',25.20,55.27],
  ['Abu Dhabi','United Arab Emirates','🇦🇪',24.45,54.38],
  ['Doha','Qatar','🇶🇦',25.29,51.53],
  ['Riyadh','Saudi Arabia','🇸🇦',24.71,46.68],
  ['Jeddah','Saudi Arabia','🇸🇦',21.49,39.19],
  ['Tel Aviv','Israel','🇮🇱',32.08,34.78],
  ['Jerusalem','Israel','🇮🇱',31.78,35.22],
  ['Beirut','Lebanon','🇱🇧',33.89,35.50],
  ['Amman','Jordan','🇯🇴',31.95,35.93],
  ['Istanbul','Turkey','🇹🇷',41.01,28.98],
  ['Ankara','Turkey','🇹🇷',39.93,32.86],
  ['Tehran','Iran','🇮🇷',35.69,51.39],
  // Europe
  ['London','United Kingdom','🇬🇧',51.51,-0.13],
  ['Manchester','United Kingdom','🇬🇧',53.48,-2.24],
  ['Edinburgh','United Kingdom','🇬🇧',55.95,-3.19],
  ['Dublin','Ireland','🇮🇪',53.35,-6.26],
  ['Paris','France','🇫🇷',48.86,2.35],
  ['Lyon','France','🇫🇷',45.76,4.84],
  ['Marseille','France','🇫🇷',43.30,5.37],
  ['Berlin','Germany','🇩🇪',52.52,13.40],
  ['Munich','Germany','🇩🇪',48.14,11.58],
  ['Hamburg','Germany','🇩🇪',53.55,9.99],
  ['Frankfurt','Germany','🇩🇪',50.11,8.68],
  ['Cologne','Germany','🇩🇪',50.94,6.96],
  ['Amsterdam','Netherlands','🇳🇱',52.37,4.90],
  ['Rotterdam','Netherlands','🇳🇱',51.92,4.48],
  ['Brussels','Belgium','🇧🇪',50.85,4.35],
  ['Antwerp','Belgium','🇧🇪',51.22,4.40],
  ['Zurich','Switzerland','🇨🇭',47.38,8.54],
  ['Geneva','Switzerland','🇨🇭',46.20,6.15],
  ['Vienna','Austria','🇦🇹',48.21,16.37],
  ['Prague','Czechia','🇨🇿',50.08,14.44],
  ['Warsaw','Poland','🇵🇱',52.23,21.01],
  ['Krakow','Poland','🇵🇱',50.06,19.94],
  ['Budapest','Hungary','🇭🇺',47.50,19.04],
  ['Copenhagen','Denmark','🇩🇰',55.68,12.57],
  ['Stockholm','Sweden','🇸🇪',59.33,18.07],
  ['Oslo','Norway','🇳🇴',59.91,10.75],
  ['Helsinki','Finland','🇫🇮',60.17,24.94],
  ['Reykjavik','Iceland','🇮🇸',64.15,-21.94],
  ['Madrid','Spain','🇪🇸',40.42,-3.70],
  ['Barcelona','Spain','🇪🇸',41.39,2.17],
  ['Seville','Spain','🇪🇸',37.39,-5.99],
  ['Valencia','Spain','🇪🇸',39.47,-0.38],
  ['Lisbon','Portugal','🇵🇹',38.72,-9.14],
  ['Porto','Portugal','🇵🇹',41.16,-8.63],
  ['Rome','Italy','🇮🇹',41.90,12.50],
  ['Milan','Italy','🇮🇹',45.46,9.19],
  ['Florence','Italy','🇮🇹',43.77,11.26],
  ['Venice','Italy','🇮🇹',45.44,12.32],
  ['Naples','Italy','🇮🇹',40.85,14.27],
  ['Athens','Greece','🇬🇷',37.98,23.73],
  ['Bucharest','Romania','🇷🇴',44.43,26.10],
  ['Sofia','Bulgaria','🇧🇬',42.70,23.32],
  ['Belgrade','Serbia','🇷🇸',44.81,20.46],
  ['Zagreb','Croatia','🇭🇷',45.81,15.98],
  ['Moscow','Russia','🇷🇺',55.76,37.62],
  ['St. Petersburg','Russia','🇷🇺',59.93,30.34],
  ['Kyiv','Ukraine','🇺🇦',50.45,30.52],
  // Africa
  ['Cairo','Egypt','🇪🇬',30.04,31.24],
  ['Casablanca','Morocco','🇲🇦',33.57,-7.59],
  ['Marrakesh','Morocco','🇲🇦',31.63,-7.99],
  ['Tunis','Tunisia','🇹🇳',36.81,10.18],
  ['Lagos','Nigeria','🇳🇬',6.52,3.38],
  ['Accra','Ghana','🇬🇭',5.60,-0.19],
  ['Nairobi','Kenya','🇰🇪',-1.29,36.82],
  ['Addis Ababa','Ethiopia','🇪🇹',9.03,38.74],
  ['Cape Town','South Africa','🇿🇦',-33.92,18.42],
  ['Johannesburg','South Africa','🇿🇦',-26.20,28.05],
  ['Dakar','Senegal','🇸🇳',14.69,-17.45],
  // North America
  ['New York','United States','🇺🇸',40.71,-74.01],
  ['Boston','United States','🇺🇸',42.36,-71.06],
  ['Washington DC','United States','🇺🇸',38.91,-77.04],
  ['Philadelphia','United States','🇺🇸',39.95,-75.17],
  ['Atlanta','United States','🇺🇸',33.75,-84.39],
  ['Miami','United States','🇺🇸',25.76,-80.19],
  ['Chicago','United States','🇺🇸',41.88,-87.63],
  ['Detroit','United States','🇺🇸',42.33,-83.05],
  ['Minneapolis','United States','🇺🇸',44.98,-93.27],
  ['Nashville','United States','🇺🇸',36.16,-86.78],
  ['New Orleans','United States','🇺🇸',29.95,-90.07],
  ['Houston','United States','🇺🇸',29.76,-95.37],
  ['Austin','United States','🇺🇸',30.27,-97.74],
  ['Dallas','United States','🇺🇸',32.78,-96.80],
  ['Denver','United States','🇺🇸',39.74,-104.99],
  ['Phoenix','United States','🇺🇸',33.45,-112.07],
  ['Las Vegas','United States','🇺🇸',36.17,-115.14],
  ['San Francisco','United States','🇺🇸',37.77,-122.42],
  ['Los Angeles','United States','🇺🇸',34.05,-118.24],
  ['San Diego','United States','🇺🇸',32.72,-117.16],
  ['Portland','United States','🇺🇸',45.52,-122.68],
  ['Seattle','United States','🇺🇸',47.61,-122.33],
  ['Honolulu','United States','🇺🇸',21.31,-157.86],
  ['Toronto','Canada','🇨🇦',43.65,-79.38],
  ['Montreal','Canada','🇨🇦',45.50,-73.57],
  ['Vancouver','Canada','🇨🇦',49.28,-123.12],
  ['Calgary','Canada','🇨🇦',51.05,-114.07],
  ['Mexico City','Mexico','🇲🇽',19.43,-99.13],
  ['Guadalajara','Mexico','🇲🇽',20.66,-103.35],
  ['Cancún','Mexico','🇲🇽',21.16,-86.85],
  ['Havana','Cuba','🇨🇺',23.13,-82.36],
  ['San Juan','Puerto Rico','🇵🇷',18.47,-66.11],
  ['Panama City','Panama','🇵🇦',8.98,-79.52],
  ['San José','Costa Rica','🇨🇷',9.93,-84.08],
  // South America
  ['Buenos Aires','Argentina','🇦🇷',-34.60,-58.38],
  ['São Paulo','Brazil','🇧🇷',-23.55,-46.63],
  ['Rio de Janeiro','Brazil','🇧🇷',-22.91,-43.17],
  ['Brasília','Brazil','🇧🇷',-15.83,-47.92],
  ['Salvador','Brazil','🇧🇷',-12.97,-38.50],
  ['Lima','Peru','🇵🇪',-12.05,-77.04],
  ['Cusco','Peru','🇵🇪',-13.53,-71.97],
  ['Santiago','Chile','🇨🇱',-33.45,-70.67],
  ['Bogotá','Colombia','🇨🇴',4.71,-74.07],
  ['Medellín','Colombia','🇨🇴',6.24,-75.58],
  ['Caracas','Venezuela','🇻🇪',10.49,-66.88],
  ['Quito','Ecuador','🇪🇨',-0.18,-78.47],
  ['Montevideo','Uruguay','🇺🇾',-34.90,-56.16],
  ['La Paz','Bolivia','🇧🇴',-16.49,-68.12],
  // Oceania
  ['Sydney','Australia','🇦🇺',-33.87,151.21],
  ['Melbourne','Australia','🇦🇺',-37.81,144.96],
  ['Brisbane','Australia','🇦🇺',-27.47,153.03],
  ['Perth','Australia','🇦🇺',-31.95,115.86],
  ['Adelaide','Australia','🇦🇺',-34.93,138.60],
  ['Auckland','New Zealand','🇳🇿',-36.85,174.76],
  ['Wellington','New Zealand','🇳🇿',-41.29,174.78],
  ['Christchurch','New Zealand','🇳🇿',-43.53,172.64]
];

const COUNTRY_CODES = {
  'Republic of Korea':'KR','Japan':'JP','China':'CN','Taiwan':'TW','Mongolia':'MN','Macau':'MO',
  'Singapore':'SG','Malaysia':'MY','Thailand':'TH','Vietnam':'VN','Philippines':'PH',
  'Indonesia':'ID','Cambodia':'KH','Laos':'LA','Myanmar':'MM',
  'India':'IN','Pakistan':'PK','Bangladesh':'BD','Nepal':'NP','Sri Lanka':'LK',
  'United Arab Emirates':'AE','Qatar':'QA','Saudi Arabia':'SA','Israel':'IL',
  'Lebanon':'LB','Jordan':'JO','Turkey':'TR','Iran':'IR',
  'United Kingdom':'UK','Ireland':'IE','France':'FR','Germany':'DE','Netherlands':'NL',
  'Belgium':'BE','Switzerland':'CH','Austria':'AT','Czechia':'CZ','Poland':'PL',
  'Hungary':'HU','Denmark':'DK','Sweden':'SE','Norway':'NO','Finland':'FI',
  'Iceland':'IS','Spain':'ES','Portugal':'PT','Italy':'IT','Greece':'GR',
  'Romania':'RO','Bulgaria':'BG','Serbia':'RS','Croatia':'HR','Russia':'RU','Ukraine':'UA',
  'Egypt':'EG','Morocco':'MA','Tunisia':'TN','Nigeria':'NG','Ghana':'GH','Kenya':'KE',
  'Ethiopia':'ET','South Africa':'ZA','Senegal':'SN',
  'United States':'US','Canada':'CA','Mexico':'MX','Cuba':'CU','Puerto Rico':'PR',
  'Panama':'PA','Costa Rica':'CR',
  'Argentina':'AR','Brazil':'BR','Peru':'PE','Chile':'CL','Colombia':'CO',
  'Venezuela':'VE','Ecuador':'EC','Uruguay':'UY','Bolivia':'BO',
  'Australia':'AU','New Zealand':'NZ'
};

const MAP_VIEW = { w: 720, h: 360 };
function lonToX(lon) { return (lon + 180) * MAP_VIEW.w / 360; }
function latToY(lat) { return (90 - lat) * MAP_VIEW.h / 180; }

const LOCATIONS = LOCATIONS_RAW.map(([name, region, flag, lat, lon]) => ({
  name, region, flag, lat, lng: lon
}));

let activeLocationField = null;
let selectedLocation = null;
let worldMapLoaded = false;

async function loadWorldMap() {
  if (worldMapLoaded) return;
  if (typeof d3 === 'undefined' || typeof topojson === 'undefined') return;
  const g = document.getElementById('world-map-land');
  if (!g) return;
  try {
    const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
    const land = topojson.feature(world, world.objects.land);
    const projection = d3.geoEquirectangular()
      .scale(MAP_VIEW.w / (2 * Math.PI))
      .translate([MAP_VIEW.w / 2, MAP_VIEW.h / 2]);
    const pathGen = d3.geoPath(projection);
    g.innerHTML = `<path d="${pathGen(land)}"></path>`;
    worldMapLoaded = true;
  } catch (e) { console.error('world map load failed', e); }
}

function openLocationPicker(fieldEl) {
  if (!profileEditMode) return;
  activeLocationField = fieldEl;
  selectedLocation = null;
  document.getElementById('location-search-input').value = '';
  document.getElementById('location-confirm').disabled = true;
  const pin = document.getElementById('world-map-pin');
  if (pin) pin.style.display = 'none';
  document.getElementById('location-pin-label').textContent = 'No location selected';
  filterLocations();
  document.getElementById('location-modal').classList.add('open');
  loadWorldMap();
  setTimeout(() => document.getElementById('location-search-input').focus(), 50);
}

function closeLocationPicker() {
  document.getElementById('location-modal').classList.remove('open');
  activeLocationField = null;
  selectedLocation = null;
}

function filterLocations() {
  const q = document.getElementById('location-search-input').value.toLowerCase().trim();
  const list = q
    ? LOCATIONS.filter(l => l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q))
    : LOCATIONS;
  const c = document.getElementById('location-results');
  if (list.length === 0) {
    c.innerHTML = '<div class="location-empty">No matching cities</div>';
    return;
  }
  c.innerHTML = list.map(l => {
    const i = LOCATIONS.indexOf(l);
    return `
      <div class="location-result" data-idx="${i}" onclick="selectLocation(${i})">
        <span class="location-result-flag">${l.flag}</span>
        <div class="location-result-text">
          <div class="location-result-name">${escapeHtml(l.name)}</div>
          <div class="location-result-region">${escapeHtml(l.region)}</div>
        </div>
      </div>`;
  }).join('');
}

function selectLocation(idx) {
  selectedLocation = LOCATIONS[idx];
  document.querySelectorAll('.location-result').forEach(el =>
    el.classList.toggle('selected', parseInt(el.dataset.idx, 10) === idx)
  );
  const pin = document.getElementById('world-map-pin');
  if (pin) {
    pin.setAttribute('cx', lonToX(selectedLocation.lng));
    pin.setAttribute('cy', latToY(selectedLocation.lat));
    pin.style.display = 'block';
  }
  document.getElementById('location-pin-label').textContent = selectedLocation.name + ', ' + selectedLocation.region;
  document.getElementById('location-confirm').disabled = false;
}

function confirmLocation() {
  if (!selectedLocation || !activeLocationField) return;
  if (activeLocationField.dataset.field === 'location') {
    const code = COUNTRY_CODES[selectedLocation.region] || selectedLocation.region.slice(0, 2).toUpperCase();
    activeLocationField.textContent = selectedLocation.name + ', ' + code;
  } else {
    activeLocationField.textContent = selectedLocation.name + ', ' + selectedLocation.region;
  }
  closeLocationPicker();
}
