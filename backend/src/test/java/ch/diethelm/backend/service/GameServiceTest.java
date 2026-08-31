package ch.diethelm.backend.service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import ch.diethelm.backend.model.Game;
import ch.diethelm.backend.repository.GameRepository;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameService gameService;

    private Game existingGame;

    @BeforeEach
    void setUp() {
        existingGame = Game.builder()
                .id(1L)
                .title("Old Title")
                .description("Old Description")
                .imageUrl("http://old-image.url")
                .releaseDate(LocalDate.of(2020, 1, 1))
                .build();
    }

    @Test
    void getAllGames_returnsListFromRepository() {
        List<Game> games = List.of(existingGame);
        when(gameRepository.findAll()).thenReturn(games);

        List<Game> result = gameService.getAllGames();

        assertThat(result).isEqualTo(games);
        verify(gameRepository).findAll();
    }

    @Test
    void getGameById_returnsGame_whenExists() {
        when(gameRepository.findById(1L)).thenReturn(Optional.of(existingGame));

        Game result = gameService.getGameById(1L);

        assertThat(result).isEqualTo(existingGame);
    }

    @Test
    void getGameById_throwsNoSuchElementException_whenNotFound() {
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.getGameById(99L))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void createGame_callsSaveAndReturnsSavedGame() {
        Game newGame = Game.builder()
                .title("New Game")
                .description("New Description")
                .imageUrl("http://new-image.url")
                .releaseDate(LocalDate.of(2024, 5, 5))
                .build();
        when(gameRepository.save(newGame)).thenReturn(existingGame);

        Game result = gameService.createGame(newGame);

        assertThat(result).isEqualTo(existingGame);
        verify(gameRepository).save(newGame);
    }

    @Test
    void updateGame_overwritesAllFields_whenExists() {
        Game updatedData = Game.builder()
                .title("New Title")
                .description("New Description")
                .imageUrl("http://new-image.url")
                .releaseDate(LocalDate.of(2024, 5, 5))
                .build();
        when(gameRepository.findById(1L)).thenReturn(Optional.of(existingGame));
        when(gameRepository.save(any(Game.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Game result = gameService.updateGame(1L, updatedData);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("New Title");
        assertThat(result.getDescription()).isEqualTo("New Description");
        assertThat(result.getImageUrl()).isEqualTo("http://new-image.url");
        assertThat(result.getReleaseDate()).isEqualTo(LocalDate.of(2024, 5, 5));
        verify(gameRepository).save(existingGame);
    }

    @Test
    void updateGame_throwsException_whenIdNotFound() {
        when(gameRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.updateGame(99L, existingGame))
                .isInstanceOf(NoSuchElementException.class);

        verify(gameRepository, never()).save(any(Game.class));
    }

    @Test
    void deleteGame_deletesGame_whenExists() {
        when(gameRepository.existsById(1L)).thenReturn(true);

        gameService.deleteGame(1L);

        verify(gameRepository).deleteById(1L);
    }

    @Test
    void deleteGame_throwsException_whenIdNotFound() {
        when(gameRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> gameService.deleteGame(99L))
                .isInstanceOf(NoSuchElementException.class);

        verify(gameRepository, never()).deleteById(anyLong());
    }

    @Test
    void searchByTitle_delegatesToFindByTitleContainingIgnoreCase() {
        List<Game> games = List.of(existingGame);
        when(gameRepository.findByTitleContainingIgnoreCase("title")).thenReturn(games);

        List<Game> result = gameService.searchByTitle("title");

        assertThat(result).isEqualTo(games);
        verify(gameRepository).findByTitleContainingIgnoreCase("title");
    }
}
