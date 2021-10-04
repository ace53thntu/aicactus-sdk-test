export const getLocation = () => {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    return {
      lat,
      long,
    };
  });
};
