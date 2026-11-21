package ch.diethelm.backend.service;

public class TitleNormalizer {
    public static String normalize(String s) {
        String title = s.trim().replaceAll("\\s+", " ");
        return Character.toUpperCase(title.charAt(0)) + title.substring(1);
    }
}
