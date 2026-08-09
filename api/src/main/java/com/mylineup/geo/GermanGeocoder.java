package com.mylineup.geo;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Grobe Geokodierung deutscher Orte für die stilisierte Besucher-Landkarte — keine externe
 * Geocoding-API. Erst wird die Stadt gegen eine kuratierte Liste großer Städte geprüft, sonst
 * dient die erste PLZ-Ziffer als grober Regions-Fallback (deckt jede deutsche PLZ ab, aber nur
 * ungefähr). Passend zur bewusst "stilisierten/ungefähren" Kartenanzeige, keine Navigationsgenauigkeit.
 * Die gleiche kuratierte Liste liefert auch das Bundesland je Stadt (für die Filterliste); Orte
 * außerhalb der Liste haben kein bekanntes Bundesland (dort dient die PLZ als Filter-Fallback).
 */
public final class GermanGeocoder {

    private GermanGeocoder() {
    }

    private record CityInfo(double lat, double lng, String state) {
    }

    public static Optional<LatLng> resolve(String city, String postalCode) {
        if (city != null && !city.isBlank()) {
            CityInfo exact = CITIES.get(normalize(city));
            if (exact != null) {
                return Optional.of(new LatLng(exact.lat(), exact.lng()));
            }
        }
        if (postalCode != null && !postalCode.isBlank()) {
            char firstDigit = postalCode.trim().charAt(0);
            LatLng region = PLZ_REGIONS.get(firstDigit);
            if (region != null) {
                return Optional.of(region);
            }
        }
        return Optional.empty();
    }

    /** Bundesland einer Stadt, sofern in der kuratierten Liste bekannt. */
    public static Optional<String> resolveState(String city) {
        if (city == null || city.isBlank()) {
            return Optional.empty();
        }
        CityInfo info = CITIES.get(normalize(city));
        return info == null ? Optional.empty() : Optional.ofNullable(info.state());
    }

    private static String normalize(String city) {
        return city.trim().toLowerCase(Locale.GERMAN);
    }

    private static Map.Entry<String, CityInfo> city(String name, double lat, double lng, String state) {
        return Map.entry(normalize(name), new CityInfo(lat, lng, state));
    }

    // Grobe Mittelpunkte je PLZ-Leitzone (erste Ziffer 0-9) — nur für Lat/Lng-Fallback,
    // deckt bewusst mehrere Bundesländer ab und eignet sich daher nicht als Bundesland-Filter.
    private static final Map<Character, LatLng> PLZ_REGIONS = Map.ofEntries(
            Map.entry('0', new LatLng(51.05, 13.40)), // Sachsen/Thüringen
            Map.entry('1', new LatLng(52.50, 13.40)), // Berlin/Brandenburg
            Map.entry('2', new LatLng(53.50, 10.00)), // Hamburg/Bremen/Nds. Nord
            Map.entry('3', new LatLng(52.30, 9.70)), // Niedersachsen/Sachsen-Anhalt
            Map.entry('4', new LatLng(51.40, 7.00)), // NRW Ruhrgebiet
            Map.entry('5', new LatLng(50.70, 7.10)), // NRW Rheinland
            Map.entry('6', new LatLng(50.00, 8.50)), // Hessen/RLP/Saarland
            Map.entry('7', new LatLng(48.70, 9.20)), // Baden-Württemberg
            Map.entry('8', new LatLng(48.30, 11.60)), // Bayern Süd
            Map.entry('9', new LatLng(49.60, 11.00)) // Bayern Nord
    );

    private static final String BW = "Baden-Württemberg";
    private static final String BY = "Bayern";
    private static final String BE = "Berlin";
    private static final String BB = "Brandenburg";
    private static final String HB = "Bremen";
    private static final String HH = "Hamburg";
    private static final String HE = "Hessen";
    private static final String MV = "Mecklenburg-Vorpommern";
    private static final String NI = "Niedersachsen";
    private static final String NW = "Nordrhein-Westfalen";
    private static final String RP = "Rheinland-Pfalz";
    private static final String SL = "Saarland";
    private static final String SN = "Sachsen";
    private static final String ST = "Sachsen-Anhalt";
    private static final String SH = "Schleswig-Holstein";
    private static final String TH = "Thüringen";

    private static final Map<String, CityInfo> CITIES = Map.ofEntries(
            city("Berlin", 52.5200, 13.4050, BE),
            city("Hamburg", 53.5511, 9.9937, HH),
            city("München", 48.1351, 11.5820, BY),
            city("Munchen", 48.1351, 11.5820, BY),
            city("Köln", 50.9375, 6.9603, NW),
            city("Koln", 50.9375, 6.9603, NW),
            city("Frankfurt am Main", 50.1109, 8.6821, HE),
            city("Frankfurt", 50.1109, 8.6821, HE),
            city("Stuttgart", 48.7758, 9.1829, BW),
            city("Düsseldorf", 51.2277, 6.7735, NW),
            city("Dusseldorf", 51.2277, 6.7735, NW),
            city("Dortmund", 51.5136, 7.4653, NW),
            city("Essen", 51.4556, 7.0116, NW),
            city("Leipzig", 51.3397, 12.3731, SN),
            city("Bremen", 53.0793, 8.8017, HB),
            city("Dresden", 51.0504, 13.7373, SN),
            city("Hannover", 52.3759, 9.7320, NI),
            city("Nürnberg", 49.4521, 11.0767, BY),
            city("Nurnberg", 49.4521, 11.0767, BY),
            city("Duisburg", 51.4344, 6.7623, NW),
            city("Bochum", 51.4818, 7.2162, NW),
            city("Wuppertal", 51.2562, 7.1508, NW),
            city("Bielefeld", 52.0302, 8.5325, NW),
            city("Bonn", 50.7374, 7.0982, NW),
            city("Münster", 51.9607, 7.6261, NW),
            city("Munster", 51.9607, 7.6261, NW),
            city("Karlsruhe", 49.0069, 8.4037, BW),
            city("Mannheim", 49.4875, 8.4660, BW),
            city("Augsburg", 48.3705, 10.8978, BY),
            city("Wiesbaden", 50.0782, 8.2398, HE),
            city("Gelsenkirchen", 51.5177, 7.0857, NW),
            city("Mönchengladbach", 51.1805, 6.4428, NW),
            city("Monchengladbach", 51.1805, 6.4428, NW),
            city("Braunschweig", 52.2689, 10.5268, NI),
            city("Chemnitz", 50.8278, 12.9214, SN),
            city("Kiel", 54.3233, 10.1228, SH),
            city("Aachen", 50.7753, 6.0839, NW),
            city("Halle", 51.4964, 11.9683, ST),
            city("Halle (Saale)", 51.4964, 11.9683, ST),
            city("Halle an der Saale", 51.4964, 11.9683, ST),
            city("Magdeburg", 52.1205, 11.6276, ST),
            city("Freiburg", 47.9990, 7.8421, BW),
            city("Freiburg im Breisgau", 47.9990, 7.8421, BW),
            city("Krefeld", 51.3388, 6.5853, NW),
            city("Lübeck", 53.8655, 10.6866, SH),
            city("Lubeck", 53.8655, 10.6866, SH),
            city("Oberhausen", 51.4963, 6.8638, NW),
            city("Erfurt", 50.9848, 11.0299, TH),
            city("Mainz", 49.9929, 8.2473, RP),
            city("Rostock", 54.0887, 12.1400, MV),
            city("Kassel", 51.3127, 9.4797, HE),
            city("Hagen", 51.3670, 7.4633, NW),
            city("Saarbrücken", 49.2401, 6.9969, SL),
            city("Saarbrucken", 49.2401, 6.9969, SL),
            city("Hamm", 51.6738, 7.8154, NW),
            city("Mülheim an der Ruhr", 51.4266, 6.8826, NW),
            city("Mulheim", 51.4266, 6.8826, NW),
            city("Potsdam", 52.3906, 13.0645, BB),
            city("Ludwigshafen", 49.4741, 8.4340, RP),
            city("Oldenburg", 53.1435, 8.2146, NI),
            city("Leverkusen", 51.0459, 6.9853, NW),
            city("Osnabrück", 52.2799, 8.0472, NI),
            city("Osnabruck", 52.2799, 8.0472, NI),
            city("Solingen", 51.1652, 7.0671, NW),
            city("Heidelberg", 49.3988, 8.6724, BW),
            city("Herne", 51.5386, 7.2256, NW),
            city("Neuss", 51.1981, 6.6912, NW),
            city("Darmstadt", 49.8728, 8.6512, HE),
            city("Paderborn", 51.7189, 8.7575, NW),
            city("Regensburg", 49.0134, 12.1016, BY),
            city("Ingolstadt", 48.7665, 11.4257, BY),
            city("Würzburg", 49.7913, 9.9534, BY),
            city("Wurzburg", 49.7913, 9.9534, BY),
            city("Fürth", 49.4783, 10.9903, BY),
            city("Dachau", 48.2601, 11.4342, BY),
            city("Wolfsburg", 52.4227, 10.7865, NI),
            city("Offenbach", 50.1055, 8.7761, HE),
            city("Ulm", 48.4011, 9.9876, BW),
            city("Heilbronn", 49.1427, 9.2109, BW),
            city("Pforzheim", 48.8922, 8.6946, BW),
            city("Göttingen", 51.5412, 9.9158, NI),
            city("Gottingen", 51.5412, 9.9158, NI),
            city("Bottrop", 51.5216, 6.9289, NW),
            city("Trier", 49.7596, 6.6441, RP),
            city("Recklinghausen", 51.6142, 7.1978, NW),
            city("Reutlingen", 48.4914, 9.2043, BW),
            city("Bremerhaven", 53.5396, 8.5809, HB),
            city("Koblenz", 50.3569, 7.5890, RP),
            city("Bergisch Gladbach", 50.9925, 7.1359, NW),
            city("Jena", 50.9271, 11.5892, TH),
            city("Remscheid", 51.1789, 7.1897, NW),
            city("Erlangen", 49.5897, 11.0040, BY),
            city("Moers", 51.4508, 6.6262, NW),
            city("Siegen", 50.8747, 8.0243, NW),
            city("Hildesheim", 52.1508, 9.9511, NI),
            city("Salzgitter", 52.1508, 10.3928, NI),
            city("Kelheim", 48.9167, 11.8833, BY),
            city("Landshut", 48.5372, 12.1522, BY),
            city("Passau", 48.5667, 13.4667, BY),
            city("Bayreuth", 49.9481, 11.5783, BY),
            city("Rosenheim", 47.8564, 12.1288, BY),
            city("Konstanz", 47.6603, 9.1758, BW),
            city("Lindau", 47.5462, 9.6839, BY),
            city("Flensburg", 54.7937, 9.4464, SH),
            city("Neubrandenburg", 53.5583, 13.2611, MV),
            city("Schwerin", 53.6355, 11.4010, MV)
    );
}
