package ch.diethelm.backend.service;

public class TitleNormalizer {

    public static String normalize(String s) {
        if (s == null || s.isBlank()) {
            throw new IllegalArgumentException("Titel darf nicht leer sein");
        }
        String title = s.trim().replaceAll("\\s+", " ");
        return Character.toUpperCase(title.charAt(0)) + title.substring(1);
    }
}