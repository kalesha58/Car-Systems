import axios from "axios";
import { GOOGLE_MAP_API } from "./config";
import { updateUserLocation } from "./authService";

export const reverseGeocode = async (latitude: number, longitude: number, setUser: any) => {
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAP_API}`
        )

        if (response.data.status === 'OK') {
            const address = response.data.results[0].formatted_address;
    
            updateUserLocation({ liveLocation: { latitude, longitude }, address }, setUser)
        } else if (response.data.status === 'REQUEST_DENIED') {
            if (response.data.error_message?.includes('Billing')) {
                console.warn("Google Maps API: Billing not enabled on project. Reverse geocoding will not work.");
            } else {
                console.error("Geo Code Failed: Request Denied", response.data.error_message);
            }
        } else {
            console.error("Geo Code Failed", response.data.status)
        }

    } catch (error) {
        console.error("Geo Code Failed", error)
    }
}
