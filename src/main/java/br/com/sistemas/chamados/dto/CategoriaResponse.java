package br.com.sistemas.chamados.dto;

import br.com.sistemas.chamados.entity.Categoria;

/** DTO devolvido pela API, sem expor diretamente a Entity. */
public record CategoriaResponse(Long id, String nome, String descricao) {

    public static CategoriaResponse de(Categoria categoria) {
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNome(),
                categoria.getDescricao()
        );
    }
}
