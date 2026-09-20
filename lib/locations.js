export const LOCATIONS = [
  { name: 'อนุสาวรีย์ชัยสมรภูมิ กรุงเทพฯ', lat: 13.7649, lng: 100.5383 },
  { name: 'เสาชิงช้า กรุงเทพฯ', lat: 13.7518, lng: 100.5011 },
  { name: 'เยาวราช กรุงเทพฯ', lat: 13.7408, lng: 100.5096 },
  { name: 'อโศก กรุงเทพฯ', lat: 13.7370, lng: 100.5602 },
  { name: 'สวนจตุจักร กรุงเทพฯ', lat: 13.8030, lng: 100.5536 },
  { name: 'วงเวียนใหญ่ กรุงเทพฯ', lat: 13.7203, lng: 100.4945 },
  { name: 'บางนา กรุงเทพฯ', lat: 13.6682, lng: 100.6047 },
  { name: 'รัชดาภิเษก กรุงเทพฯ', lat: 13.7797, lng: 100.5732 },
  { name: 'เชียงใหม่', lat: 18.7882, lng: 98.9853 },
  { name: 'เชียงราย', lat: 19.9072, lng: 99.8325 },
  { name: 'ลำปาง', lat: 18.2887, lng: 99.4909 },
  { name: 'พิษณุโลก', lat: 16.8211, lng: 100.2659 },
  { name: 'นครสวรรค์', lat: 15.7047, lng: 100.1372 },
  { name: 'พระนครศรีอยุธยา', lat: 14.3532, lng: 100.5689 },
  { name: 'หัวหิน ประจวบคีรีขันธ์', lat: 12.5683, lng: 99.9577 },
  { name: 'พัทยา ชลบุรี', lat: 12.9276, lng: 100.8771 },
  { name: 'ระยอง', lat: 12.6814, lng: 101.2816 },
  { name: 'จันทบุรี', lat: 12.6113, lng: 102.1038 },
  { name: 'นครราชสีมา', lat: 14.9799, lng: 102.0978 },
  { name: 'ขอนแก่น', lat: 16.4322, lng: 102.8236 },
  { name: 'อุดรธานี', lat: 17.4138, lng: 102.7872 },
  { name: 'อุบลราชธานี', lat: 15.2447, lng: 104.8473 },
  { name: 'บุรีรัมย์', lat: 14.9930, lng: 103.1029 },
  { name: 'ภูเก็ต', lat: 7.8840, lng: 98.3891 },
  { name: 'กระบี่', lat: 8.0863, lng: 98.9063 },
  { name: 'สุราษฎร์ธานี', lat: 9.1382, lng: 99.3215 },
  { name: 'นครศรีธรรมราช', lat: 8.4304, lng: 99.9631 },
  { name: 'หาดใหญ่ สงขลา', lat: 7.0084, lng: 100.4747 }
]

export const LOCATION_BY_NAME = new Map(LOCATIONS.map(location => [location.name, location]))

export function distanceKm(aLat, aLng, bLat, bLng) {
  const radius = 6371
  const radians = Math.PI / 180
  const latitudeDelta = (bLat - aLat) * radians
  const longitudeDelta = (bLng - aLng) * radians
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(aLat * radians) * Math.cos(bLat * radians) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(haversine))
}

export function scoreForDistance(distance) {
  return Math.max(0, Math.round(5000 * Math.exp(-distance / 450)))
}
