package br.com.sistemas.chamados.exception;

/** Lançada quando um recurso procurado não existe (vira HTTP 404) */
public class RecursoNaoEncontradoException extends RunTimeException {
    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}