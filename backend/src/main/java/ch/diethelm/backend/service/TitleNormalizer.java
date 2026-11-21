package ch.diethelm.backend.service;

public class TitleNormalizer {
    public static String normalize(String s) {
        return Character.toUpperCase(s.trim().replaceAll("\\s+", " ").charAt(0))
                + s.trim().replaceAll("\\s+", " ").substring(1);
    }
}
