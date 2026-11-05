package br.com.sistemas.chamados.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.ClienteRequest;
import br.com.sistemas.chamados.dto.ClienteResponse;
import br.com.sistemas.chamados.exception.GlobalExceptionHandler;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.ChamadoService;
import br.com.sistemas.chamados.service.ClienteService;

@WebMvcTest(controllers = ClienteController.class)
@Import(GlobalExceptionHandler.class)
class ClienteControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private ClienteService clienteService;
    @MockitoBean private ChamadoService chamadoService;

    @Test
    void deveCriarClienteERetornar201() throws Exception {
        when(clienteService.criar(any(ClienteRequest.class)))
                .thenReturn(new ClienteResponse(1L, "Ana", "ana@exemplo.com", "47999990000"));

        mockMvc.perform(post("/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Ana\",\"email\":\"ana@exemplo.com\",\"telefone\":\"47999990000\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("ana@exemplo.com"));
    }

    @Test
    void deveRejeitarDadosInvalidosERetornar400() throws Exception {
        mockMvc.perform(post("/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"\",\"email\":\"email-invalido\",\"telefone\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Erro de validação"));
    }

    @Test
    void deveRetornar409QuandoEmailForDuplicado() throws Exception {
        when(clienteService.criar(any(ClienteRequest.class)))
                .thenThrow(new RegraNegocioException("Já existe cliente com esse e-mail"));

        mockMvc.perform(post("/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Ana\",\"email\":\"ana@exemplo.com\",\"telefone\":\"47999990000\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornar404QuandoClienteNaoExistir() throws Exception {
        when(clienteService.buscar(eq(999L)))
                .thenThrow(new RecursoNaoEncontradoException("Cliente 999 não encontrado"));

        mockMvc.perform(get("/clientes/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Cliente 999 não encontrado"));
    }
}
