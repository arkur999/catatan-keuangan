// Aplikasi Pencatatan Keuangan
document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const form = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const transactionHistory = document.getElementById('transaction-history');
    const balanceElement = document.getElementById('balance');
    const incomeElement = document.getElementById('income');
    const expenseElement = document.getElementById('expense');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Inisialisasi array transaksi
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Inisialisasi aplikasi
    initApp();

    // Event Listener
    form.addEventListener('submit', addTransaction);
    filterButtons.forEach(button => {
        button.addEventListener('click', filterTransactions);
    });

    // Inisialisasi aplikasi
    function initApp() {
        updateSummary();
        renderTransactions();
    }

    // Menambahkan transaksi baru
    function addTransaction(e) {
        e.preventDefault();

        // Mendapatkan nilai form
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const type = typeSelect.value;
        const category = categorySelect.value;
        const date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

        // Validasi input
        if (!description || isNaN(amount) || amount <= 0) {
            alert('Silakan masukkan detail transaksi yang valid');
            return;
        }

        // Membuat objek transaksi
        const transaction = {
            id: generateId(),
            description,
            amount: Math.abs(amount), // Memastikan jumlah positif
            type,
            category,
            date
        };

        // Menambahkan ke array transaksi
        transactions.push(transaction);

        // Menyimpan ke localStorage
        saveTransactions();

        // Memperbarui UI
        renderTransactions();
        updateSummary();

        // Mereset form
        form.reset();
    }

    // Menghasilkan ID unik untuk transaksi
    function generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Menampilkan transaksi ke UI
    function renderTransactions(filter = 'all') {
        // Membersihkan transaksi saat ini
        transactionHistory.innerHTML = '';

        // Memfilter transaksi berdasarkan filter yang dipilih
        let filteredTransactions = transactions;
        if (filter !== 'all') {
            filteredTransactions = transactions.filter(transaction => transaction.type === filter);
        }

        // Memeriksa apakah ada transaksi untuk ditampilkan
        if (filteredTransactions.length === 0) {
            transactionHistory.innerHTML = '<p class="no-transactions">Tidak ada transaksi ditemukan.</p>';
            return;
        }

        // Mengurutkan transaksi berdasarkan tanggal (terbaru dulu)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Menampilkan setiap transaksi
        filteredTransactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.classList.add('transaction-item');

            // Format jumlah dengan mata uang
            const formattedAmount = formatCurrency(transaction.amount);

            // Dapatkan nama kategori yang dapat dibaca
            const categoryName = getCategoryName(transaction.category);

            // Ubah label jenis transaksi
            const transactionType = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

            transactionElement.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-meta">
                        <span>${categoryName}</span>
                        <span>${transaction.date}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}-amount">${transaction.type === 'income' ? '+' : '-'}${formattedAmount}</div>
                <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')">Hapus</button>
            `;

            transactionHistory.appendChild(transactionElement);
        });
    }

    // Format mata uang (IDR - Rupiah Indonesia)
    function formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Dapatkan nama kategori yang dapat dibaca
    function getCategoryName(category) {
        const categoryNames = {
            'salary': 'Gaji',
            'freelance': 'Freelance',
            'investment': 'Investasi',
            'food': 'Makanan',
            'transportation': 'Transportasi',
            'entertainment': 'Hiburan',
            'shopping': 'Belanja',
            'utilities': 'Utilitas',
            'other': 'Lainnya'
        };

        return categoryNames[category] || category;
    }

    // Memperbarui ringkasan (saldo, pemasukan, pengeluaran)
    function updateSummary() {
        // Menghitung total
        const totalIncome = transactions
            .filter(transaction => transaction.type === 'income')
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        const totalExpense = transactions
            .filter(transaction => transaction.type === 'expense')
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        const balance = totalIncome - totalExpense;

        // Memperbarui elemen UI
        balanceElement.textContent = formatCurrency(balance);
        incomeElement.textContent = formatCurrency(totalIncome);
        expenseElement.textContent = formatCurrency(totalExpense);

        // Memperbarui warna berdasarkan saldo
        if (balance >= 0) {
            balanceElement.style.color = '#2ecc71';
        } else {
            balanceElement.style.color = '#e74c3c';
        }
    }

    // Filter transaksi
    function filterTransactions() {
        // Hapus kelas aktif dari semua tombol
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Tambahkan kelas aktif ke tombol yang diklik
        this.classList.add('active');

        // Dapatkan nilai filter
        const filter = this.getAttribute('data-filter');

        // Tampilkan transaksi dengan filter
        renderTransactions(filter);
    }

    // Simpan transaksi ke localStorage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Buat fungsi deleteTransaction tersedia secara global untuk onclick inline
    window.deleteTransaction = function(id) {
        // Konfirmasi penghapusan
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            // Hapus transaksi dari array
            transactions = transactions.filter(transaction => transaction.id !== id);

            // Simpan ke localStorage
            saveTransactions();

            // Perbarui UI
            renderTransactions();
            updateSummary();
        }
    };

    // Tambahkan event listener untuk tombol cetak laporan
    document.getElementById('print-report-btn').addEventListener('click', generatePDFReport);

    // Fungsi untuk menghasilkan laporan PDF
    async function generatePDFReport() {
        if (transactions.length === 0) {
            alert('Tidak ada transaksi untuk dilaporkan. Silakan tambahkan transaksi terlebih dahulu.');
            return;
        }

        // Import library jsPDF
        const { jsPDF } = window.jspdf;

        // Buat dokumen PDF baru
        const doc = new jsPDF();

        // Tambahkan judul
        doc.setFontSize(20);
        doc.text('Laporan Keuangan', 20, 20);

        // Tambahkan tanggal pembuatan laporan
        const currentDate = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFontSize(12);
        doc.text(`Tanggal Pembuatan: ${currentDate}`, 20, 30);

        // Tambahkan daftar transaksi
        if (transactions.length > 0) {
            let yPosition = 50;
            doc.setFontSize(16);
            doc.text('Daftar Transaksi', 20, yPosition);
            yPosition += 15;

            // Header tabel
            doc.setFontSize(12);
            doc.text('Tanggal', 20, yPosition);
            doc.text('Deskripsi', 50, yPosition);
            doc.text('Kategori', 100, yPosition);
            doc.text('Jumlah', 140, yPosition);
            doc.text('Tipe', 170, yPosition);

            yPosition += 8;
            doc.line(15, yPosition, 200, yPosition); // Garis pembatas

            // Urutkan transaksi berdasarkan tanggal (terbaru dulu)
            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

            // Isi data transaksi
            for (const transaction of sortedTransactions) {
                if (yPosition > 270) { // Jika hampir mencapai akhir halaman
                    doc.addPage(); // Tambah halaman baru
                    yPosition = 20;

                    // Tambahkan judul di halaman baru
                    doc.setFontSize(16);
                    doc.text('Daftar Transaksi (Lanjutan)', 20, yPosition);
                    yPosition += 15;

                    // Ulangi header tabel
                    doc.setFontSize(12);
                    doc.text('Tanggal', 20, yPosition);
                    doc.text('Deskripsi', 50, yPosition);
                    doc.text('Kategori', 100, yPosition);
                    doc.text('Jumlah', 140, yPosition);
                    doc.text('Tipe', 170, yPosition);

                    yPosition += 8;
                    doc.line(15, yPosition, 200, yPosition); // Garis pembatas
                }

                // Tambahkan baris transaksi
                doc.setFontSize(10);
                doc.text(transaction.date, 20, yPosition);
                doc.text(transaction.description.substring(0, 15) + (transaction.description.length > 15 ? '...' : ''), 50, yPosition); // Potong deskripsi jika terlalu panjang
                doc.text(getCategoryName(transaction.category), 100, yPosition);
                doc.text(formatCurrency(transaction.amount), 140, yPosition);
                doc.text(transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran', 170, yPosition);

                yPosition += 8;
            }
        }

        // Simpan file PDF
        doc.save(`Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
});