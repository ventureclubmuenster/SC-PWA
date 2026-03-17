export const scheduleQuery = `*[_type == "schedule"] | order(time asc) {
  _id,
  title,
  time,
  endTime,
  location,
  category,
  description,
  "speaker": speaker->{
    _id,
    name,
    "photo": photo.asset->url,
    linkedin,
    bio
  }
}`;

export const speakersQuery = `*[_type == "speaker"] | order(name asc) {
  _id,
  name,
  "photo": photo.asset->url,
  linkedin,
  bio
}`;

export const partnersQuery = `*[_type == "partner"] | order(category asc, name asc) {
  _id,
  name,
  "logo": logo.asset->url,
  description,
  boothNumber,
  category,
  website
}`;

export const workshopsQuery = `*[_type == "workshop"] | order(time asc) {
  _id,
  title,
  description,
  capacity,
  time,
  endTime,
  location,
  host,
  "hostLogo": hostLogo.asset->url
}`;
