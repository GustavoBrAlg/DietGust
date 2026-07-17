import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        self.saveState()
        
        # We don't draw headers/footers on the cover page (Page 1)
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0f172a"))
            self.drawString(54, 745, "DIETGUST — MANUAL DE INSTRUÇÕES")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawRightString(558, 745, "Guia do Usuário PWA")
            
            # Header Line
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 737, 558, 737)
            
            # Footer Line
            self.line(54, 52, 558, 52)
            
            # Footer
            self.drawString(54, 38, "© 2026 DietGust. Desenvolvido para Organização de Dieta & Treinos.")
            page_text = f"Página {self._pageNumber} de {page_count}"
            self.drawRightString(558, 38, page_text)
            
        self.restoreState()

def create_manual_pdf(filename="Manual_de_Instrucoes_DietGust.pdf"):
    # Target page width/height in points
    # Letter size: 612 x 792
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom styles definitions
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=colors.HexColor("#0f172a"),
        alignment=0, # Left aligned
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#475569"),
        spaceAfter=30
    )
    
    metadata_style = ParagraphStyle(
        'CoverMetadata',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#16a34a"), # Forest Green Accent
        spaceAfter=5
    )
    
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=15,
        spaceAfter=12,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#334155"),
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=6
    )
    
    info_box_style = ParagraphStyle(
        'InfoBoxText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # ─────────────────────────────────────────────────────────────────────────
    # COVER PAGE
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 100))
    story.append(Paragraph("Diet<font color='#16a34a'>Gust</font>", title_style))
    story.append(Paragraph("Manual de Instruções & Guia de Uso do Sistema", subtitle_style))
    
    # Divider line
    divider_data = [['']]
    divider_table = Table(divider_data, colWidths=[504], rowHeights=[4])
    divider_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#16a34a")),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider_table)
    story.append(Spacer(1, 40))
    
    # Metadata info
    story.append(Paragraph("DOCUMENTO DE APOIO AO USUÁRIO", metadata_style))
    story.append(Paragraph("Versão do App: 4.0 (PWA com Inteligência Artificial)", body_style))
    story.append(Paragraph("Ano de Publicação: 2026", body_style))
    story.append(Paragraph("Plataforma: Web App / Mobile / Desktop (Offline Support)", body_style))
    
    story.append(Spacer(1, 120))
    story.append(Paragraph("Este manual contém todas as informações necessárias para operar o aplicativo DietGust, gerenciar treinos e dietas gerados por Inteligência Artificial (Gemini), atualizar métricas de perfil corporais e instalar a aplicação offline como PWA.", body_style))
    
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE 2: SECTIONS 1, 2 & 3
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("1. Introdução ao DietGust", h1_style))
    story.append(Paragraph("O <b>DietGust</b> é uma aplicação progressiva moderna (PWA) desenvolvida para facilitar a rotina de treinos e dieta de entusiastas fitness. Utilizando tecnologia de Inteligência Artificial de ponta (Google Gemini), o sistema gera planejamentos semanais personalizados a partir de poucos cliques, integrando rotinas de exercícios de força e cardiovasculares com planos alimentares completos.", body_style))
    story.append(Paragraph("Todas as informações geradas são persistidas de forma segura em nuvem através de integração direta com o Supabase (PostgreSQL), permitindo acesso instantâneo de qualquer dispositivo conectado ou offline.", body_style))
    
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("2. Cadastro e Autenticação", h1_style))
    story.append(Paragraph("Para acessar o sistema pela primeira vez, é necessário registrar uma conta pessoal na tela inicial:", body_style))
    story.append(Paragraph("• <b>Criar Conta</b>: Clique em 'Cadastre-se', digite seu Nome Completo, E-mail, Idade e crie uma senha forte (mínimo de 6 caracteres).", bullet_style))
    story.append(Paragraph("• <b>Fazer Login</b>: Se já possuir cadastro, digite o E-mail e a Senha cadastrados para entrar.", bullet_style))
    story.append(Paragraph("• <b>Sessão Persistente</b>: Ao logar, a sessão é salva no seu navegador por 7 dias. Você não precisará redigitar seus dados a menos que clique no botão 'Sair' do cabeçalho.", bullet_style))
    
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("3. Geração de Planos Inteligentes com IA", h1_style))
    story.append(Paragraph("A principal funcionalidade do DietGust é a criação de planejamentos automáticos baseados nas suas características físicas corporais atuais. Para criar um plano:", body_style))
    story.append(Paragraph("1. Clique no botão de destaque <b>+ Novo Plano com IA</b> na barra lateral do painel principal.", bullet_style))
    story.append(Paragraph("2. Insira sua <b>Altura em centímetros</b> (ex: 175 para 1,75m) e seu <b>Peso em quilogramas</b> (ex: 75.5).", bullet_style))
    story.append(Paragraph("3. Selecione seu objetivo atual entre duas opções dedicadas:", bullet_style))
    story.append(Paragraph("   - <b>🔥 Ganhar Massa</b>: Foco em hipertrofia, ganho de volume muscular e superávit calórico controlado.", bullet_style))
    story.append(Paragraph("   - <b>⚡ Definição</b>: Foco em queima de gordura corporal, tônus muscular e déficit calórico focado em proteínas.", bullet_style))
    story.append(Paragraph("4. Clique em <b>Gerar Plano</b>. A Inteligência Artificial (modelos Gemini) processará suas informações em aproximadamente 15 a 30 segundos, salvando automaticamente no seu histórico corporal e abrindo a visualização do plano na tela.", bullet_style))
    
    # Informational Callout Box
    callout_data = [[
        Paragraph("<b>Aviso de Fallback:</b> Caso sua conexão de rede falhe ou a IA do Gemini atinja o limite de requisições, o DietGust utilizará uma base inteligente de planos predefinidos criados por profissionais de educação física de acordo com sua faixa de IMC, garantindo que você nunca fique sem treino ou dieta.", info_box_style)
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(Spacer(1, 5))
    story.append(callout_table)
    
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE 3: SECTIONS 4, 5, 6 & 7
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("4. Entendendo o Dashboard", h1_style))
    story.append(Paragraph("O painel de controle centraliza suas informações do plano selecionado de forma clara e visualmente limpa:", body_style))
    story.append(Paragraph("• <b>Navegação de Dias</b>: No topo do plano ativo, botões horizontais dividem a visualização pelos dias úteis (Segunda a Sexta). Ao selecionar um dia, a rotina de treinos e dieta mudam automaticamente.", bullet_style))
    story.append(Paragraph("• <b>💪 Rotina de Treino</b>: Exibe a lista de exercícios recomendados para o dia, indicando o número de séries, repetições alvo e observações essenciais de execução.", bullet_style))
    story.append(Paragraph("• <b>🥗 Plano Alimentar</b>: Exibe as refeições propostas para o dia organizadas por horário sugerido e a lista exata dos alimentos que compõem cada porção calórica.", bullet_style))
    
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("5. Gerenciamento do Histórico", h1_style))
    story.append(Paragraph("Na barra lateral esquerda, abaixo do seu Perfil, localiza-se o <b>Histórico de Planos</b>. Cada plano gerado no sistema cria um cartão resumido indicando a data de criação, IMC, objetivo principal (🎯) e métricas.", body_style))
    story.append(Paragraph("• <b>Selecionar Plano</b>: Clique em qualquer cartão do histórico para carregar a rotina de treinos e dietas daquele planejamento específico no centro do dashboard.", bullet_style))
    story.append(Paragraph("• <b>Excluir Plano</b>: Para remover um plano do seu banco de dados permanentemente, clique no ícone de lixeira (🗑️) no canto superior direito do cartão e confirme a caixa de alerta do navegador.", bullet_style))
    
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("6. Edição de Métricas (✏️ Alterar Peso)", h1_style))
    story.append(Paragraph("Se você iniciou um plano e seu peso corporal mudou (ganhou ou perdeu peso), não é necessário gerar um novo plano completo se quiser manter a mesma estrutura de treinos. Você pode atualizar apenas as métricas de peso:", body_style))
    story.append(Paragraph("1. No cartão do plano desejado na barra lateral, localize o pequeno ícone de lápis (✏️) posicionado logo abaixo da lixeira.", bullet_style))
    story.append(Paragraph("2. Clique no lápis (✏️). Um modal de edição exclusivo será aberto na tela.", bullet_style))
    story.append(Paragraph("3. Digite o seu <b>Novo Peso em kg</b>. Por questões de consistência do plano de treino, apenas o Peso é editável; a altura e outros parâmetros permanecem fixos.", bullet_style))
    story.append(Paragraph("4. Clique em <b>Salvar Alteração</b>. O sistema enviará os dados, recalculará em tempo real o novo <b>IMC</b> e atualizará a sua <b>Classificação de Peso</b> (ex: 'Peso normal', 'Sobrepeso'). Os resultados são atualizados imediatamente no cartão e no cabeçalho central.", bullet_style))
    
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("7. Instalação como Aplicativo Offline (PWA)", h1_style))
    story.append(Paragraph("O DietGust é otimizado para se comportar como um aplicativo nativo no seu smartphone ou computador utilizando a tecnologia PWA:", body_style))
    story.append(Paragraph("• <b>No Celular (Android/Chrome)</b>: Ao acessar o site, uma barra inferior 'Instalar o DietGust' ou pop-up será exibida. Clique nela para adicionar o app à sua tela inicial. O app abrirá sem barra de navegação do browser e em tela cheia.", bullet_style))
    story.append(Paragraph("• <b>No iOS (iPhone/Safari)</b>: Acesse o link do site no Safari, clique no botão de compartilhamento (quadrado com seta para cima) e selecione a opção <b>'Adicionar à Tela de Início'</b>.", bullet_style))
    story.append(Paragraph("• <b>No Computador (Chrome/Edge)</b>: Na barra de endereços do seu navegador, clique no ícone de instalação (um monitor com uma seta para baixo) para ter o programa como um software independente no Windows/macOS.", bullet_style))
    
    # Final footer decoration
    story.append(Spacer(1, 20))
    story.append(divider_table)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    create_manual_pdf()
    print("PDF Manual gerado com sucesso!")
