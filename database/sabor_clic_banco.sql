-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: sabor_clic
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agendamentos_bancadas`
--

DROP TABLE IF EXISTS `agendamentos_bancadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamentos_bancadas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bancada_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `status` enum('pendente','confirmado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (`id`),
  KEY `fk_agendamento_bancada` (`bancada_id`),
  KEY `fk_agendamento_cliente` (`cliente_id`),
  KEY `idx_agendamento_datas` (`data_inicio`,`data_fim`),
  KEY `idx_agendamento_status` (`status`),
  CONSTRAINT `fk_agendamento_bancada` FOREIGN KEY (`bancada_id`) REFERENCES `bancadas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_agendamento_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_agendamento_periodo` CHECK ((`data_fim` > `data_inicio`))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agendamentos_bancadas`
--

LOCK TABLES `agendamentos_bancadas` WRITE;
/*!40000 ALTER TABLE `agendamentos_bancadas` DISABLE KEYS */;
INSERT INTO `agendamentos_bancadas` VALUES (1,1,2,'2026-12-10 09:00:00','2026-12-10 12:00:00','cancelado'),(2,2,2,'2026-12-15 10:00:00','2026-12-15 11:00:00','confirmado');
/*!40000 ALTER TABLE `agendamentos_bancadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bancadas`
--

DROP TABLE IF EXISTS `bancadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bancadas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `valor_hora` decimal(10,2) NOT NULL,
  `disponivel` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_bancadas_disponivel` (`disponivel`),
  CONSTRAINT `chk_bancadas_valor` CHECK ((`valor_hora` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bancadas`
--

LOCK TABLES `bancadas` WRITE;
/*!40000 ALTER TABLE `bancadas` DISABLE KEYS */;
INSERT INTO `bancadas` VALUES (1,'Bancada Profissional 1 - Confeitaria','Batedeira planetaria, forno industrial e bancada em inox.',50.00,1),(2,'Bancada Profissional 2 - Fogao Quente','Fogao, fritadeira e exaustor.',65.00,1),(3,'Bancada de Montagem de Pratos','Espaco para finalizacao de embalagens e delivery.',35.00,1);
/*!40000 ALTER TABLE `bancadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estoque`
--

DROP TABLE IF EXISTS `estoque`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estoque` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_item` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_atual` decimal(10,3) NOT NULL,
  `unidade_medida` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade_minima` decimal(10,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome_item` (`nome_item`),
  CONSTRAINT `chk_estoque_quantidade` CHECK ((`quantidade_atual` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estoque`
--

LOCK TABLES `estoque` WRITE;
/*!40000 ALTER TABLE `estoque` DISABLE KEYS */;
INSERT INTO `estoque` VALUES (1,'Batata',49.400,'kg',0.000),(2,'Farinha de Trigo',29.800,'kg',0.000),(3,'Molho de Tomate',19.700,'litros',0.000),(4,'Carne Bovina',17.000,'kg',0.000),(5,'Queijo Cheddar',10.000,'kg',0.000),(6,'Arroz Arboreo',11.800,'kg',0.000),(7,'Cogumelos Frescos',4.920,'kg',0.000);
/*!40000 ALTER TABLE `estoque` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ficha_tecnica`
--

DROP TABLE IF EXISTS `ficha_tecnica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ficha_tecnica` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prato_id` int NOT NULL,
  `estoque_id` int NOT NULL,
  `quantidade_necessaria` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ficha_prato_ingrediente` (`prato_id`,`estoque_id`),
  KEY `idx_ficha_estoque` (`estoque_id`),
  CONSTRAINT `fk_ficha_estoque` FOREIGN KEY (`estoque_id`) REFERENCES `estoque` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ficha_prato` FOREIGN KEY (`prato_id`) REFERENCES `pratos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_ficha_quantidade` CHECK ((`quantidade_necessaria` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ficha_tecnica`
--

LOCK TABLES `ficha_tecnica` WRITE;
/*!40000 ALTER TABLE `ficha_tecnica` DISABLE KEYS */;
INSERT INTO `ficha_tecnica` VALUES (1,1,1,0.300),(2,1,2,0.100),(3,1,3,0.150),(4,2,4,0.180),(5,2,5,0.050),(6,3,6,0.200),(7,3,7,0.080);
/*!40000 ALTER TABLE `ficha_tecnica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itens_pedido`
--

DROP TABLE IF EXISTS `itens_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `prato_id` int NOT NULL,
  `quantidade` int NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pedido_prato` (`pedido_id`,`prato_id`),
  KEY `idx_itens_prato` (`prato_id`),
  CONSTRAINT `fk_item_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_prato` FOREIGN KEY (`prato_id`) REFERENCES `pratos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_item_preco` CHECK ((`preco_unitario` >= 0)),
  CONSTRAINT `chk_item_quantidade` CHECK ((`quantidade` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens_pedido`
--

LOCK TABLES `itens_pedido` WRITE;
/*!40000 ALTER TABLE `itens_pedido` DISABLE KEYS */;
INSERT INTO `itens_pedido` VALUES (1,1,1,2,32.50),(2,2,3,1,45.00);
/*!40000 ALTER TABLE `itens_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `status` enum('Aguardando','Em Preparo','Iniciando Preparo','Pronto para Entrega','Entregue','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Aguardando',
  `tempo_estimado` int DEFAULT NULL,
  `data_pedido` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pedido_cliente` (`cliente_id`),
  KEY `idx_pedidos_status` (`status`),
  KEY `idx_pedidos_data` (`data_pedido`),
  CONSTRAINT `fk_pedido_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pedido_tempo` CHECK (((`tempo_estimado` is null) or (`tempo_estimado` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,2,'Em Preparo',20,'2026-11-14 17:52:11'),(2,2,'Aguardando',NULL,'2026-11-14 19:26:23');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pratos`
--

DROP TABLE IF EXISTS `pratos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pratos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `preco` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `admin_id` int NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Outros',
  PRIMARY KEY (`id`),
  KEY `fk_pratos_admin` (`admin_id`),
  KEY `idx_pratos_ativo` (`ativo`),
  KEY `idx_pratos_nome` (`nome`),
  CONSTRAINT `fk_pratos_admin` FOREIGN KEY (`admin_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pratos_preco` CHECK ((`preco` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pratos`
--

LOCK TABLES `pratos` WRITE;
/*!40000 ALTER TABLE `pratos` DISABLE KEYS */;
INSERT INTO `pratos` VALUES (1,'Nhoque Artesanal ao Sugo','Nhoque fresco de batata com molho de tomate rustico e manjericao.',32.50,1,1,'Outros'),(2,'Hamburguer Artesanal Sabor & Clic','Blend de carne, queijo cheddar e molho da casa.',28.90,1,1,'Outros'),(3,'Risoto de Cogumelos','Arroz arboreo com cogumelos frescos e parmesao.',45.00,1,1,'Outros');
/*!40000 ALTER TABLE `pratos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('administrador','cliente','cozinheiro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `endereco` text COLLATE utf8mb4_unicode_ci,
  `turno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `especialidade` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuarios_tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Carlos Gestor','admin@saborclic.com','scrypt:32768:8:1$g9P2Aq6oDqZLsGxb$0b85e5df869c8143acef0df42f6ef8e89cfc4945bacb059fe3f195cebb7b29b6659fa95f426fbb3ba1753f202e47c48c1a3c3b98e6db0100a8e7d860b16aedc3','administrador',NULL,NULL,NULL,'2026-11-14 17:46:55'),(2,'Ana Cliente','ana@email.com','scrypt:32768:8:1$WpruCTsjLOu6UuPC$7c2deee79ab26ebb4f26570aebed6ddba38f7b585776df99664ad167896a2f0dea03bc066469ab9980b6b2a43500381a29388d33c8593d2d516a570dfb7a475b','cliente','gAAAAABq-QkilXfRTBYL_KUuzj9jb2K79Pp5pGLo00hgw9tEalBRl7su3qUwLUY36ikTCqK5ye9RCVBo9GlB8At7a2Ual8nJHzn7VLybnCBBvMTqV7XwgSw=',NULL,NULL,'2026-11-14 17:46:55'),(3,'Bruno Cozinheiro','bruno.chef@saborclic.com','scrypt:32768:8:1$jJbeFuvDrPgHJEBA$2feb2e6699d43123d001fbf1e50da72299f544255280992d1a566aef0b8f5979a31ed296d7458106409f78b7b5e5c5c2de33343a015e01563d23853c1b990776','cozinheiro',NULL,'Manha','Massas e Molhos','2026-11-14 17:46:55'),(4,'Beatriz M','beatriz@email.com','scrypt:32768:8:1$utP6bpEmLMSypAYX$56aab58ca0431655ae11e090bfb2a1202dbc507f7c2dfdf5acb683b72cff71692db4761b7b79eeae9580679824ba68911c54889401bdff86dc4dc89ba3eed382','cliente','gAAAAABq-QkicJHoRN6i24Q8jLq6EhEWlHmFXW09m09zzeyvkxlbcsjDCUgOiStimhDpzjHr35gVbK34BzZ1dmoYNc9pOy50YQ==',NULL,NULL,'2026-11-14 21:29:33');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-14 22:26:35
