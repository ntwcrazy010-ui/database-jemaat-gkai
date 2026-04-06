class JamaatDatabase {
    constructor() {
        this.SHEET_ID = '1PdHzLlYaOIaqSEBHTeARFpLBgtECdb7iMShIGbMuL1U'; // SHEET Anda
        this.API_KEY = 'AIzaSyAsJloUdW3fYvEhMbNl75UhCwR8TNDTEks'; // API Key Anda
        this.form = document.getElementById('jamaatForm');
        this.message = document.getElementById('message');
        this.totalJamaat = document.getElementById('totalJamaat');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.loadStats();
        
        // Auto-format nomor HP Indonesia
        const noHpInput = document.getElementById('noHp');
        noHpInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('0')) {
                value = '62' + value.substr(1);
            } else if (value.length > 1 && !value.startsWith('62')) {
                value = '62' + value;
            }
            e.target.value = value;
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validasi
        const nama = document.getElementById('nama').value.trim();
        const noHp = document.getElementById('noHp').value.replace(/\D/g, '');
        
        if (nama.length < 2) {
            this.showMessage('❌ Nama minimal 2 karakter', 'error');
            return;
        }
        
        if (!/^62[1-9][0-9]{8,12}$/.test(noHp)) {
            this.showMessage('❌ Nomor HP tidak valid (min 10 digit)', 'error');
            return;
        }
        
        const formData = new FormData(this.form);
        const data = {
            nama: nama,
            tempatLahir: formData.get('tempatLahir'),
            tanggalLahir: formData.get('tanggalLahir'),
            noHp: noHp,
            timestamp: new Date().toLocaleString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        // Loading
        const submitBtn = this.form.querySelector('button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        submitBtn.disabled = true;

        try {
            await this.saveToSheet(data);
            this.showMessage('✅ Data jemaat berhasil disimpan ke database!', 'success');
            this.form.reset();
            this.loadStats();
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('❌ Gagal menyimpan: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async saveToSheet(data) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/A:E!append?valueInputOption=RAW&key=${this.API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: [[
                    data.nama,
                    data.tempatLahir,
                    data.tanggalLahir,
                    data.noHp,
                    data.timestamp
                ]]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status}`);
        }
    }

    async loadStats() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/A:E?key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            const total = data.values ? data.values.length - 1 : 0;
            this.totalJamaat.textContent = total.toLocaleString('id-ID');
        } catch (error) {
            console.error('Stats error:', error);
            this.totalJamaat.textContent = '?';
        }
    }

    showMessage(text, type) {
        this.message.innerHTML = text;
        this.message.className = `message ${type}`;
        this.message.style.display = 'block';
        
        setTimeout(() => {
            this.message.style.display = 'none';
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JamaatDatabase();
});