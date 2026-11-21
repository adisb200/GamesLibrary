package ch.diethelm.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TitleNormalizerTest {

    @Test
    void normalize_trimsSurroundingSpaces() {
        assertEquals("Zelda", TitleNormalizer.normalize("  Zelda  "));
    }

    @Test
    void normalize_collapsesMultipleSpaces() {
        assertEquals("The Legend of Zelda", TitleNormalizer.normalize("The   Legend  of    Zelda"));
    }

    @Test
    void normalize_capitalisesFirstLetter() {
        assertEquals("Zelda", TitleNormalizer.normalize("zelda"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void normalize_emptyInput_throws(String input) {
        assertThrows(IllegalArgumentException.class, () -> TitleNormalizer.normalize(input));
    }
}