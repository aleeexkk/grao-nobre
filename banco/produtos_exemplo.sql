-- Produtos de exemplo do Grão Nobre (cardápio de cafeteria/padaria) para testar o site.
-- Como usar: abra no DBeaver, escolha a conexão localhost (Ctrl + 9) e execute tudo com Alt + X.
-- Pode rodar mais de uma vez: o que já existe é pulado (nome de categoria e de produto não repete).

USE grao_nobre;

-- 1) Categorias
INSERT INTO categoria (nome, descricao) VALUES
    ('Cafés', 'Cafés quentes e gelados'),
    ('Bebidas', 'Sucos, refrigerantes, águas e chás'),
    ('Pães', 'Pães frescos, assados durante o dia'),
    ('Salgados', 'Salgados assados e fritos'),
    ('Doces', 'Bolos, tortas e docinhos'),
    ('Lanches', 'Sanduíches e lanches rápidos')
ON DUPLICATE KEY UPDATE nome = categoria.nome; -- se a categoria já existe, não faz nada

-- 2) Produtos (cada um aponta pra categoria pelo NOME; o banco troca pelo id sozinho)
INSERT INTO produto (nome, descricao, preco, id_categoria)
SELECT t.nome, t.descricao, t.preco, c.id_categoria
FROM (
    SELECT 'Café coado' AS nome, 'Café passado na hora' AS descricao, 4.50 AS preco, 'Cafés' AS categoria
    UNION ALL SELECT 'Café com leite', 'Café coado com leite quente', 6.50, 'Cafés'
    UNION ALL SELECT 'Café gelado', 'Expresso com gelo e leite', 10.00, 'Cafés'
    UNION ALL SELECT 'Latte', 'Expresso com bastante leite vaporizado', 10.50, 'Cafés'
    UNION ALL SELECT 'Macchiato', 'Expresso com uma marquinha de leite', 7.50, 'Cafés'
    UNION ALL SELECT 'Mocaccino', 'Expresso, chocolate e leite vaporizado', 11.00, 'Cafés'
    UNION ALL SELECT 'Chocolate quente', 'Chocolate cremoso com leite', 9.50, 'Cafés'

    UNION ALL SELECT 'Suco de laranja', 'Laranja espremida na hora', 8.00, 'Bebidas'
    UNION ALL SELECT 'Suco de maracujá', 'Polpa natural, sem conservantes', 8.00, 'Bebidas'
    UNION ALL SELECT 'Limonada', 'Limão com gelo e um toque de açúcar', 7.00, 'Bebidas'
    UNION ALL SELECT 'Vitamina de banana', 'Banana, leite e aveia', 11.00, 'Bebidas'
    UNION ALL SELECT 'Chá gelado', 'Chá de pêssego com gelo', 6.50, 'Bebidas'
    UNION ALL SELECT 'Refrigerante lata', 'Lata de 350 ml', 6.00, 'Bebidas'
    UNION ALL SELECT 'Água mineral', 'Garrafa de 500 ml', 3.50, 'Bebidas'
    UNION ALL SELECT 'Água com gás', 'Garrafa de 500 ml', 4.00, 'Bebidas'

    UNION ALL SELECT 'Pão francês', 'Unidade, crocante por fora', 1.20, 'Pães'
    UNION ALL SELECT 'Pão integral', 'Fatiado, com grãos', 12.00, 'Pães'
    UNION ALL SELECT 'Pão de forma', 'Pacote de 500 g', 9.90, 'Pães'
    UNION ALL SELECT 'Baguete', 'Pão longo de casca fina', 8.50, 'Pães'
    UNION ALL SELECT 'Croissant', 'Folhado de manteiga', 8.00, 'Pães'
    UNION ALL SELECT 'Pão italiano', 'Pão de miolo macio com azeite', 14.00, 'Pães'

    UNION ALL SELECT 'Empada de frango', 'Massa que desmancha, recheio cremoso', 7.50, 'Salgados'
    UNION ALL SELECT 'Esfiha de carne', 'Esfiha aberta de carne temperada', 7.00, 'Salgados'
    UNION ALL SELECT 'Enroladinho de salsicha', 'Massa fofinha assada', 6.50, 'Salgados'
    UNION ALL SELECT 'Quibe', 'Quibe frito de carne', 6.50, 'Salgados'
    UNION ALL SELECT 'Pastel de queijo', 'Pastel frito na hora', 8.50, 'Salgados'
    UNION ALL SELECT 'Folhado de presunto e queijo', 'Massa folhada assada', 9.00, 'Salgados'

    UNION ALL SELECT 'Bolo de chocolate', 'Fatia com cobertura de brigadeiro', 9.00, 'Doces'
    UNION ALL SELECT 'Torta de limão', 'Fatia com merengue', 12.00, 'Doces'
    UNION ALL SELECT 'Pudim', 'Fatia de pudim de leite condensado', 8.50, 'Doces'
    UNION ALL SELECT 'Brownie', 'Chocolate meio amargo', 9.00, 'Doces'
    UNION ALL SELECT 'Cookie', 'Cookie com gotas de chocolate', 6.50, 'Doces'
    UNION ALL SELECT 'Sonho', 'Recheado com creme', 7.00, 'Doces'
    UNION ALL SELECT 'Palha italiana', 'Brigadeiro com biscoito', 6.00, 'Doces'

    UNION ALL SELECT 'Misto quente', 'Pão, presunto e queijo na chapa', 10.00, 'Lanches'
    UNION ALL SELECT 'Sanduíche natural', 'Frango, cenoura e requeijão', 13.00, 'Lanches'
    UNION ALL SELECT 'Pão com ovo', 'Pão francês na chapa com ovo', 9.50, 'Lanches'
    UNION ALL SELECT 'Torrada com requeijão', 'Quatro fatias de pão torrado', 8.50, 'Lanches'
    UNION ALL SELECT 'Tapioca de queijo', 'Tapioca recheada com queijo', 11.00, 'Lanches'
    UNION ALL SELECT 'Bauru', 'Rosbife, queijo e tomate no pão francês', 16.00, 'Lanches'
) AS t
JOIN categoria c ON c.nome = t.categoria
ON DUPLICATE KEY UPDATE nome = produto.nome; -- se o produto já existe, não faz nada
