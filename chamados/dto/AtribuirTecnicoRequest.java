package br.com.sistemas.chamados.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AtribuirTecnicoRequest(
        @NotNull(message = "ID do técnico é obrigatório")
        @Positive(message = "ID do técnico deve ser positivo")
        Long tecnicoId
) {}
