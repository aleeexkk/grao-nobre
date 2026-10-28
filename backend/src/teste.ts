import { Usuario } from "./entidades/Usuario";
import { ErroValidacao } from "./erros/ErroValidacao";

// Usuário válido: e-mail e CPF voltam já tratados
const u = new Usuario("Alex", "Alex@Email.com", "Senha@123", "529.982.247-25");
console.log(u.nome, u.email, u.cpf);

// Alteração válida pelo setter
u.nome = "Alex Silva";
console.log(u.nome);

// Alteração inválida: o setter barra com o erro personalizado
try {
    u.cpf = "111.111.111-11";
} catch (erro) {
    if (erro instanceof ErroValidacao) console.log("Capturou:", erro.message);
}

// Criação inválida: o construtor barra também
try {
    new Usuario("Alex", "alex@", "Senha@123", "529.982.247-25");
} catch (erro) {
    if (erro instanceof ErroValidacao) console.log("Capturou:", erro.message);
}