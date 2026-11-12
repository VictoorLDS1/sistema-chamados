package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import br.com.sistemas.chamados.entity.Categoria;

@DataJpaTest
class CategoriaRepositoryTest {
    @Autowired private CategoriaRepository repository;

    @Test
    void deveSalvarEBuscarCategoria() {
        Categoria salva = repository.save(new Categoria("Hardware", "Equipamentos"));
        assertThat(salva.getId()).isNotNull();
        assertThat(repository.findById(salva.getId())).isPresent();
    }

    @Test
    void deveIdentificarNomeDuplicado() {
        repository.saveAndFlush(new Categoria("Rede", "Conectividade"));
        assertThat(repository.existsByNome("Rede")).isTrue();
        assertThat(repository.existsByNome("Software")).isFalse();
    }
}
