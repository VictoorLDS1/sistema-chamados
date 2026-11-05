package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import br.com.sistemas.chamados.entity.Cliente;

@DataJpaTest
class ClienteRepositoryTest {
    @Autowired private ClienteRepository repository;

    @Test
    void deveSalvarEBuscarCliente() {
        Cliente salvo = repository.save(new Cliente("Ana", "ana@exemplo.com", "47999990000"));
        assertThat(salvo.getId()).isNotNull();
        assertThat(repository.findById(salvo.getId())).isPresent();
    }

    @Test
    void deveIdentificarEmailDuplicado() {
        repository.saveAndFlush(new Cliente("Ana", "ana@exemplo.com", null));
        assertThat(repository.existsByEmail("ana@exemplo.com")).isTrue();
        assertThat(repository.existsByEmail("outro@exemplo.com")).isFalse();
    }
}
