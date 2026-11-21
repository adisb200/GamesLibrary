package ch.diethelm.backend.service;

public class TitleNormalizer {
    public static String normalize(String s) {
            return s.trim().replaceAll("\\s+", " ");
    }
}
