package br.com.sistemas.chamados.service;

import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.sistemas.chamados.dto.AtribuirTecnicoRequest;
import br.com.sistemas.chamados.dto.AtualizarStatusChamadoRequest;
import br.com.sistemas.chamados.dto.ChamadoRequest;
import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.repository.CategoriaRepository;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ClienteRepository;
import br.com.sistemas.chamados.repository.TecnicoRepository;

@Service
public class ChamadoService {

    private final ChamadoRepository chamadoRepository;
    private final ClienteRepository clienteRepository;
    private final CategoriaRepository categoriaRepository;
    private final TecnicoRepository tecnicoRepository;

    public ChamadoService(ChamadoRepository chamadoRepository,
                          ClienteRepository clienteRepository,
                          CategoriaRepository categoriaRepository,
                          TecnicoRepository tecnicoRepository) {
        this.chamadoRepository = chamadoRepository;
        this.clienteRepository = clienteRepository;
        this.categoriaRepository = categoriaRepository;
        this.tecnicoRepository = tecnicoRepository;
    }

    @Transactional
    public ChamadoResponse criar(ChamadoRequest dto) {
        Cliente cliente = buscarCliente(dto.clienteId());
        Categoria categoria = buscarCategoria(dto.categoriaId());
        Tecnico tecnico = buscarTecnico(dto.tecnicoId());

        // Todo chamado novo nasce ABERTO e recebe dataAbertura no @PrePersist.
        Chamado chamado = new Chamado(dto.titulo(), dto.descricao(),
                dto.prioridade(), cliente, categoria, tecnico);
        chamado.setStatus(StatusChamado.ABERTO);
        chamado.setDataFechamento(null);
        return ChamadoResponse.de(chamadoRepository.save(chamado));
    }

    @Transactional(readOnly = true)
    public Page<ChamadoResponse> listar(StatusChamado status, Prioridade prioridade,
                                        Long clienteId, Pageable pageable) {
        return chamadoRepository.buscarComFiltros(status, prioridade, clienteId, pageable)
                .map(ChamadoResponse::de);
    }

    @Transactional(readOnly = true)
    public Page<ChamadoResponse> listarPorCliente(Long clienteId, Pageable pageable) {
        // Garante resposta 404 quando o cliente informado não existe.
        buscarCliente(clienteId);
        return chamadoRepository.findByClienteId(clienteId, pageable)
                .map(ChamadoResponse::de);
    }

    @Transactional(readOnly = true)
    public ChamadoResponse buscar(Long id) {
        return ChamadoResponse.de(buscarEntidade(id));
    }

    @Transactional
    public ComentarioResponse adicionarComentario(Long chamadoId, ComentarioRequest dto) {
        Chamado chamado = buscarEntidade(chamadoId);
        Comentario comentario = new Comentario(dto.texto().trim(), dto.autor().trim(), chamado);
        return ComentarioResponse.de(comentarioRepository.save(comentario));
    }

    @Transactional(readOnly = true)
    public List<ComentarioResponse> listarComentarios(Long chamadoId) {
        buscarEntidade(chamadoId);
        return comentarioRepository.findByChamadoIdOrderByDataAsc(chamadoId)
                .stream().map(ComentarioResponse::de).toList();
    }

    @Transactional
    public ChamadoResponse atualizar(Long id, ChamadoRequest dto) {
        Chamado chamado = buscarEntidade(id);
        garantirNaoFechado(chamado, "alterar");

        chamado.setTitulo(dto.titulo());
        chamado.setDescricao(dto.descricao());
        chamado.setPrioridade(dto.prioridade());
        chamado.setCliente(buscarCliente(dto.clienteId()));
        chamado.setCategoria(buscarCategoria(dto.categoriaId()));
        chamado.setTecnico(buscarTecnico(dto.tecnicoId()));

        // Compatibilidade com o PUT já existente: se vier status, aplica a mesma regra.
        if (dto.status() != null) {
            aplicarStatus(chamado, dto.status());
        }
        return ChamadoResponse.de(chamado);
    }

    @Transactional
    public ChamadoResponse atribuirTecnico(Long id, AtribuirTecnicoRequest dto) {
        Chamado chamado = buscarEntidade(id);
        garantirNaoFechado(chamado, "atribuir técnico a");
        chamado.setTecnico(buscarTecnico(dto.tecnicoId()));
        return ChamadoResponse.de(chamado);
    }

    @Transactional
    public ChamadoResponse atualizarStatus(Long id, AtualizarStatusChamadoRequest dto) {
        Chamado chamado = buscarEntidade(id);
        garantirNaoFechado(chamado, "alterar o status de");
        aplicarStatus(chamado, dto.status());
        return ChamadoResponse.de(chamado);
    }

    private void aplicarStatus(Chamado chamado, StatusChamado novoStatus) {
        if (chamado.getStatus() == StatusChamado.FECHADO) {
            throw new RegraNegocioException("Não é permitido alterar um chamado fechado");
        }
        chamado.setStatus(novoStatus);
        if (novoStatus == StatusChamado.FECHADO) {
            chamado.setDataFechamento(LocalDateTime.now());
        } else {
            chamado.setDataFechamento(null);
        }
    }

    private void garantirNaoFechado(Chamado chamado, String acao) {
        if (chamado.getStatus() == StatusChamado.FECHADO) {
            throw new RegraNegocioException("Não é permitido " + acao + " chamado fechado");
        }
    }

    @Transactional
    public void excluir(Long id) {
        Chamado chamado = buscarEntidade(id);
        garantirNaoFechado(chamado, "excluir");
        chamadoRepository.delete(chamado);
    }

    private Chamado buscarEntidade(Long id) {
        return chamadoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Chamado " + id + " não encontrado"));
    }

    private Cliente buscarCliente(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Cliente " + id + " não encontrado"));
    }

    private Categoria buscarCategoria(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Categoria " + id + " não encontrada"));
    }

    private Tecnico buscarTecnico(Long id) {
        return tecnicoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Técnico " + id + " não encontrado"));
    }
}
