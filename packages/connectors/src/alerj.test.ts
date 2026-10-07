import { describe, expect, it } from 'vitest';
import { lerLista, lerPerfil } from './alerj';

// Trechos reais das páginas da ALERJ (06/10/2026).
const lista = `
<select><option value="19">12&#186; Legislatura (2015 – 2019)</option></select>
<h2 class="margin_bottom_10">13&#186; Legislatura (2023 – 2027)<span> 70 deputados</span></h2>
<div class="controle_deputado">
    <div class="imagem">
        <a href="/Deputados/PerfilDeputado/505?Legislatura=20"><img src="/Uploads/PerfilDeputado/Imagem/24022023_133211AlanLopes.jpg" alt="ALAN LOPES"></a>
    </div>
    <div class="descricao">
        <div class="partido">PL</div>
        <div class="nome"><a href="/Deputados/PerfilDeputado/505?Legislatura=20">ALAN LOPES</a></div>
    </div>
</div>
<div class="controle_deputado lider">
    <div class="descricao">
        <div class="partido">PSOL</div>
        <div class="nome"><a href="/Deputados/PerfilDeputado/420?Legislatura=20">FL&#193;VIO SERAFINI</a></div>
    </div>
</div>`;

describe('lerLista', () => {
  it('extrai id, nome, partido e foto', () => {
    const r = lerLista(lista);
    expect(r.legislatura).toBe('20');
    // O período vem do título, não do seletor de legislaturas antigas.
    expect(r.inicio).toBe('2023-02-01');
    expect(r.fim).toBe('2027-01-31');
    expect(r.deputados).toEqual([
      {
        id: '505',
        legislatura: '20',
        nome: 'ALAN LOPES',
        partido: 'PL',
        fotoUrl:
          'https://www.alerj.rj.gov.br/Uploads/PerfilDeputado/Imagem/24022023_133211AlanLopes.jpg',
      },
      { id: '420', legislatura: '20', nome: 'FLÁVIO SERAFINI', partido: 'PSOL', fotoUrl: null },
    ]);
  });

  it('falha alto se o formato mudar', () => {
    expect(() => lerLista('<html>sem deputados</html>')).toThrow(/formato/);
  });
});

describe('lerPerfil', () => {
  it('extrai contato e foto oficial', () => {
    const html = `<a class="example-image-link" href="/Uploads/PerfilDeputado/Imagem/media_x_FotoOficial.jpg">
      CONTATO (21) 2588-1000 AlanLopes@alerj.rj.gov.br`;
    expect(lerPerfil(html)).toEqual({
      email: 'alanlopes@alerj.rj.gov.br',
      telefone: '(21) 2588-1000',
      fotoOficialUrl:
        'https://www.alerj.rj.gov.br/Uploads/PerfilDeputado/Imagem/media_x_FotoOficial.jpg',
    });
  });

  it('não inventa contato ausente', () => {
    expect(lerPerfil('<p>sem contato</p>')).toEqual({
      email: null,
      telefone: null,
      fotoOficialUrl: null,
    });
  });
});
