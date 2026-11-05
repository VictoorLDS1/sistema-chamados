package br.com.sistemas.chamados.dto;

import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ChamadoRequest(
        @NotBlank(message = "Título é obrigatório")
        @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
        String titulo,

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
        String descricao,

        @NotNull(message = "Prioridade é obrigatória")
        Prioridade prioridade,

        @NotNull(message = "ID do cliente é obrigatório")
        @Positive(message = "ID do cliente deve ser positivo")
        Long clienteId,

        @NotNull(message = "ID da categoria é obrigatório")
        @Positive(message = "ID da categoria deve ser positivo")
        Long categoriaId,

        @NotNull(message = "ID do técnico é obrigatório")
        @Positive(message = "ID do técnico deve ser positivo")
        Long tecnicoId,

        // Na criação, o serviço ignora este campo e inicia sempre como ABERTO.
        StatusChamado status
) {}
