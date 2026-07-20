import React, { useState, useEffect } from 'react';
import { FileText, Calculator } from 'lucide-react';

export default function FechamentoCliente() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>({});
  
  const [closingCustomerId, setClosingCustomerId] = useState<string>('');
  const [closingPeriodType, setClosingPeriodType] = useState<'day' | 'month' | 'year'>('month');
  const [closingDate, setClosingDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [closingMonthYear, setClosingMonthYear] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [closingYear, setClosingYear] = useState<string>(() => new Date().getFullYear().toString());
  const [closingResult, setClosingResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCustomers, resSales] = await Promise.all([
          fetch('/api/customers').then(r => r.json()).catch(() => []),
          // Assuming we need all sales for a customer, but the API doesn't have an endpoint for all sales right now
          // We will mock it or fetch what we can. The actual system should have a /api/sales
          fetch('/api/dashboard/stats').then(r => r.json()).catch(() => []) 
        ]);
        setCustomers(Array.isArray(resCustomers) ? resCustomers : []);
        // setAllSales(resSales); // For now this will be empty, in reality it should fetch sales
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCalculateClosing = () => {
    if (!closingCustomerId) {
      alert("Selecione um cliente para o fechamento.");
      return;
    }

    const customerIdNum = parseInt(closingCustomerId);
    
    // Filtro as vendas do cliente (using allSales)
    let customerSales = (allSales || []).filter(s => s.customer_id === customerIdNum);

    // Filtro por período
    customerSales = customerSales.filter(s => {
      const saleDate = new Date(s.date);
      const saleDateLocal = new Date(saleDate.getTime() - (saleDate.getTimezoneOffset() * 60000));
      
      if (closingPeriodType === 'day') {
        return saleDateLocal.toISOString().split('T')[0] === closingDate;
      } else if (closingPeriodType === 'month') {
        const [year, month] = closingMonthYear.split('-');
        return saleDateLocal.getFullYear() === parseInt(year) && (saleDateLocal.getMonth() + 1) === parseInt(month);
      } else {
        return saleDateLocal.getFullYear() === parseInt(closingYear);
      }
    });

    if (customerSales.length === 0) {
      alert("Nenhum registro financeiro encontrado para este cliente neste período. (Verifique se as vendas estão integradas na API)");
      setClosingResult(null);
      return;
    }

    let totalPecas = 0;
    let totalServicos = 0;
    let totalBruto = 0;
    let totalLiquido = 0;

    const pecasList: any[] = [];
    const servicosList: any[] = [];

    customerSales.forEach(sale => {
      let saleTotalPecas = 0;
      let saleTotalServicos = 0;
      let hasLaborInItems = false;

      (sale.items || sale.sale_items || []).forEach((item: any) => {
        if (item.type === 'Adicional Interno') return;

        const itemTotal = item.price * item.quantity;
        if (item.description === 'MÃO DE OBRA / SERVIÇOS AVULSOS' || item.type === 'Serviço Principal') {
          hasLaborInItems = true;
        }

        if (item.type === 'Serviço' || item.type === 'Serviço Principal' || item.description.toUpperCase().includes('MÃO DE OBRA')) {
          totalServicos += itemTotal;
          saleTotalServicos += itemTotal;
          servicosList.push({ ...item, date: sale.date, saleId: sale.id });
        } else {
          totalPecas += itemTotal;
          saleTotalPecas += itemTotal;
          pecasList.push({ ...item, date: sale.date, saleId: sale.id });
        }
      });

      if (sale.type === 'Oficina' && sale.labor_value > 0 && !hasLaborInItems) {
        totalServicos += sale.labor_value;
        saleTotalServicos += sale.labor_value;
        servicosList.push({ 
          description: 'Mão de Obra (Registro Antigo)', 
          quantity: 1, 
          price: sale.labor_value, 
          date: sale.date, 
          saleId: sale.id 
        });
      }

      totalBruto += (saleTotalPecas + saleTotalServicos);
      totalLiquido += sale.total;
    });

    const descontos = totalBruto > totalLiquido ? (totalBruto - totalLiquido) : 0;
    const acrescimos = totalLiquido > totalBruto ? (totalLiquido - totalBruto) : 0;

    const customerDetails = customers.find(c => c.id === customerIdNum);
    setClosingResult({
      customerName: customerDetails?.name,
      customerDetails,
      periodLabel: closingPeriodType === 'day' 
        ? new Date(closingDate + 'T00:00:00').toLocaleDateString('pt-BR') 
        : closingPeriodType === 'month' 
          ? closingMonthYear.split('-').reverse().join('/') 
          : closingYear,
      totalPecas,
      totalServicos,
      totalBruto,
      totalLiquido,
      descontos,
      acrescimos,
      pecasList,
      servicosList
    });
  };

  const handleWhatsAppShare = () => {
    if (!closingResult || !(closingResult.customerDetails as any)?.whatsapp) {
      alert("O cliente não possui WhatsApp cadastrado para envio automático.");
      return;
    }
    
    let text = `*RESUMO DE FECHAMENTO*\n`;
    text += `Cliente: ${closingResult.customerName}\n`;
    text += `Período: ${closingResult.periodLabel}\n\n`;
    
    if (closingResult.pecasList.length > 0) {
      text += `*PEÇAS E ACESSÓRIOS*\n`;
      const groupedPecas = Object.values(
        closingResult.pecasList.reduce((acc: any, p: any) => {
          const key = `d_${p.description}`;
          if (!acc[key]) acc[key] = { ...p, totalItemPrice: p.price * p.quantity };
          else { acc[key].quantity += p.quantity; acc[key].totalItemPrice += p.price * p.quantity; }
          return acc;
        }, {})
      );
      groupedPecas.forEach((p: any) => {
        text += `${p.quantity}x ${p.description} - ${formatBRL(p.totalItemPrice)}\n`;
      });
      text += `Subtotal Peças: ${formatBRL(closingResult.totalPecas)}\n\n`;
    }
    
    if (closingResult.servicosList.length > 0) {
      text += `*MÃO DE OBRA E SERVIÇOS*\n`;
      const groupedServicos = Object.values(
        closingResult.servicosList.reduce((acc: any, s: any) => {
          const key = `d_${s.description}`;
          if (!acc[key]) acc[key] = { ...s, totalItemPrice: s.price * s.quantity };
          else { acc[key].quantity += s.quantity; acc[key].totalItemPrice += s.price * s.quantity; }
          return acc;
        }, {})
      );
      groupedServicos.forEach((s: any) => {
        text += `${s.quantity}x ${s.description} - ${formatBRL(s.totalItemPrice)}\n`;
      });
      text += `Subtotal Serviços: ${formatBRL(closingResult.totalServicos)}\n\n`;
    }
    
    text += `*VALOR TOTAL GERAL:* ${formatBRL(closingResult.totalLiquido)}`;
    
    const url = `https://wa.me/55${(closingResult.customerDetails as any).whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText size={24} className="text-indigo-500" />
          Calcular Fechamento do Cliente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Cliente</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={closingCustomerId}
              onChange={e => { setClosingCustomerId(e.target.value); setClosingResult(null); }}
            >
              <option value="">Selecione um cliente...</option>
              {[...customers].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Período</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={closingPeriodType}
              onChange={e => { setClosingPeriodType(e.target.value as any); setClosingResult(null); }}
            >
              <option value="day">Por Dia</option>
              <option value="month">Por Mês</option>
              <option value="year">Por Ano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Data do Período</label>
            {closingPeriodType === 'day' ? (
              <input
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={closingDate}
                onChange={e => { setClosingDate(e.target.value); setClosingResult(null); }}
              />
            ) : closingPeriodType === 'month' ? (
              <input
                type="month"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={closingMonthYear}
                onChange={e => { setClosingMonthYear(e.target.value); setClosingResult(null); }}
              />
            ) : (
              <input
                type="number"
                min="2000"
                max="2100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={closingYear}
                onChange={e => { setClosingYear(e.target.value); setClosingResult(null); }}
              />
            )}
          </div>
        </div>

        <button
          onClick={handleCalculateClosing}
          className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Calculator size={20} /> Calcular Fechamento do Cliente
        </button>
      </div>

      {closingResult && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-200">
          <div className="text-center mb-8 border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase">Resumo de Fechamento</h2>
            <p className="text-slate-500 text-lg font-bold">{closingResult.customerName}</p>
          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={handleWhatsAppShare} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600">Compartilhar WhatsApp</button>
          </div>
        </div>
      )}
    </div>
  );
}
