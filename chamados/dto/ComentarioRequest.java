package br.com.sistemas.chamados.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComentarioRequest(
        @NotBlank(message = "Texto do comentário é obrigatório")
        @Size(max = 2000, message = "Comentário deve ter no máximo 2000 caracteres")
        String texto,

        @NotBlank(message = "Autor é obrigatório")
        @Size(max = 150, message = "Autor deve ter no máximo 150 caracteres")
        String autor
) {}
