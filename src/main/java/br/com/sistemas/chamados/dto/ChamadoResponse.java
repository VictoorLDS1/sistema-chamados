package br.com.sistemas.chamados.dto;

import java.time.LocalDateTime;
import java.util.List;

import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
public record ChamadoResponse(
        Long id,
        String titulo,
        String descricao,
        LocalDateTime dataAbertura,
        LocalDateTime dataFechamento,
        Prioridade prioridade,
        StatusChamado status,
        Long clienteId,
        String clienteNome,
        Long categoriaId,
        String categoriaNome,
        Long tecnicoId,
        String tecnicoNome,
        List<ComentarioResponse> comentarios
) {
    public static ChamadoResponse de(Chamado chamado) {
        return new ChamadoResponse(
                chamado.getId(),
                chamado.getTitulo(),
                chamado.getDescricao(),
                chamado.getDataAbertura(),
                chamado.getDataFechamento(),
                chamado.getPrioridade(),
                chamado.getStatus(),
                chamado.getCliente().getId(),
                chamado.getCliente().getNome(),
                chamado.getCategoria().getId(),
                chamado.getCategoria().getNome(),
                chamado.getTecnico().getId(),
                chamado.getTecnico().getNome(),
                chamado.getComentarios().stream().map(ComentarioResponse::de).toList()
        );
    }
}
