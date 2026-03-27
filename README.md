# NETICS Open Recruitment 2026  
## Modul 1 – CI/CD Deployment API

---
| Riyan Fadli Amazzadin | 5025241068 | 
|---|---| 


## URL API
```
http://70.153.17.62/health
```
---

## Deskripsi Singkat
Pada tugas kali ini, saya membuat API menggunakan `express`. Alasan saya memilih express adalah karena dokumentasi yang mudah diakses serta saya merasa lebih familiar menggunakan javascript dibanding python. Struktur repository ini adalah sebagai berikut:
<br>
```
netics-oprec-module1-2026/
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── ansible/
│   └── playbook.yml
│
├── nginx/
│   └── nginx.conf
│
├── api/
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── .gitignore
```
<br>
---

## API
```javascript
const express = require('express')
const app = express()
const port = 3000
const start = Date.now()


app.get('/health', (req, res) => {
    const uptime = Date.now() - start;

    res.json({
        nama: "Riyan Fadli Amazzadin",
        nrp: "5025241068",
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: uptime
    })
})

app.listen(port, () => {
    console.log(`API running on port ${port}`)
})
```

### Penjelasan Implementasi

Pada bagian awal, kode meng-import package `express` untuk digunakan dalam class `app`. Express menyediakan fungsi-fungsi seperti `get`, dan `post` yang memungkinkan kita untuk melayani request dari client. Setelah itu, kode mendefinisikan endpoint `/health` yang berisi data-data yang relevan. Untuk mendapatkan waktu running server, setiap kali client memanggil endpoint `/health`, server mengurangi value `Date.now()` saat ini dengan `Date.now()` ketika server dimulai untuk mendapatkan durasi uptime server dalam satuan ms. Setelah itu, durasi tersebut akan diubah menjadi format yang lebih mudah dibaca melalui fungsi `formatUptime()`. Terakhir, setelah endpoint telah dibuat, server membuka koneksi pada port 3000 menggunakan fungsi `listen()`.

---

## Docker

### Dockerfile
```dockerfile
FROM node:24.14.0-alpine
WORKDIR /src
COPY package.json ./
RUN npm install
COPY . .
CMD ["node", "src/api.js"]
```

Karena server menggunakan express, kita perlu menggunakan node.js untuk bisa menjalankan server. Node yang digunakan adalah versi terbaru yakni 24.14.0-alpine. Setelah itu, docker image dapat dibuild dan run menggunakan command:
```bash
docker build -t node-api .
docker run -p 3000:3000 node-api
```

yang akan dijalankan melalui ansible. 

---
## Nginx Reverse Proxy

### Konfigurasi
```nginx
server {
    listen 80;
    server_name 70.153.17.62;

location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Penjelasan
Nginx sebagai reverse proxy akan meneruskan request client ke API. Untuk melakukan ini, nginx akan berjalan pada domain yang tertulis pada `server_name`. Karena saya tidak menggunakan domain, pada bagian `server_name` dapat diisi dengan public ip dari VPS yang digunakan. Nginx menggunakan port 80 yang merupakan port default dari http. 

Untuk dapat meneruskan koneksi ke API, konfigurasi nginx perlu menunjukkan di mana alamat API yang sedang dijalankan. Alamat ini diletakkan pada `location` tepatnya pada `proxy_pass`. Karena pada file `api.js` saya menggunakan port 3000, proxy_pass ini diisi dengan `localhost:3000`. Parameter lain dalam `location` menangani lebih detail bagaimana koneksi tersebut diteruskan, salah satunya yaitu versi http yang digunakan yang dapat diatur pada bagian `proxy_http_version`. 

---

## Ansible

### Struktur Folder
```
ansible/
├── playbook.yml
```

### Playbook
```yaml
---
- name: deploy newest version of api
  hosts: vps
  become: yes

  tasks:

    - name: add github to known hosts
      ansible.builtin.known_hosts:
          name: github.com
          key: "{{ lookup('pipe', 'ssh-keyscan github.com') }}"
          path: /root/.ssh/known_hosts   
          state: present

    - name: pull latest changes
      git:
        repo: git@github.com:shikajiko/netics-oprec-module1-2026.git
        dest: "{{ repo_path }}"
        version: main
        accept_hostkey: yes
        key_file: /home/riyanfadli/.ssh/id_ed25519
      become_user: riyanfadli  

    - name: build docker image
      command: docker build -t node-api .
      args:
        chdir: "{{ app_path }}"

    - name: run docker container
      community.docker.docker_container:
        name: node-api
        image: node-api
        state: started
        restart_policy: always
        ports:
        - "3000:3000"
    
    - name: install nginx
      apt: 
        name: nginx
        state: latest
        update_cache: yes

    - name: remove default nginx config
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent

    - name: add nginx config
      copy:
        src: "{{ playbook_dir }}/../../src/nginx/health-api"
        dest: /etc/nginx/sites-available/health-api
        owner: root       
        group: root
        mode: '0644'
      
    - name: enable web
      file: 
        src: /etc/nginx/sites-available/health-api
        dest: /etc/nginx/sites-enabled/health-api
        state: link

    - name: check if nginx is running
      systemd:
        name: nginx
        enabled: yes
        state: started

  vars:
    user: "riyanfadli"
    app_path: "/home/riyanfadli/netics-oprec-module1-2026/src/app"
    repo_path: "/home/riyanfadli/netics-oprec-module1-2026"

```

### Penjelasan


---

## CI/CD GitHub Actions

### Workflow File
```
.github/workflows/deploy.yml
```

```yaml
# isi workflow
```

### Penjelasan
Jelaskan alur CI/CD:
- build
- push image
- deploy ke VPS

---

## Hasil Deployment

### Output API
```json
{
  "nama": "",
  "nrp": "",
  "status": "UP",
  "timestamp": "",
  "uptime": ""
}
```

### Screenshot
Tambahkan screenshot:
- API berjalan
- Docker container
- Nginx
- GitHub Actions success

---

## References
- ChatGPT - How Does an API work and how do you create it? <br>
  (conversation link: https://chatgpt.com/share/69c5f27c-d460-8320-ac71-26e220a10297)

- Claude - Suplementary explanation for the official ansible docs <br>
  (conversation link: https://claude.ai/share/574561f5-f731-4a6b-8c68-8099842a60cc)

- Express.js documentation <br>
  (https://expressjs.com/en/starter/hello-world.html)

- MDN Reference <br>
  (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now) <br>
  (https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/deployment)
 
- Writing Ansible Playbook for Nginx <br>
  (https://dev.to/dpuig/creating-an-ansible-playbook-to-install-and-configure-nginx-for-hosting-static-websites-3n6j

- Ansible documentation

- Github actions documentation <br>
  (https://docs.github.com/en/actions/tutorials/create-an-example-workflow)

- Using github actions with ansible <br>
  (https://oneuptime.com/blog/post/2026-02-21-how-to-run-ansible-playbooks-in-github-actions/view)

steps:
1. menulis api -> pakai node + express karena lebih familiar
2. install node 
3. konfigurasi dockerfile supaya install dependency dan run npm 
command:
docker build -t node-api .
docker run -p 8000:3000 --name node-api node-api
4. pastikan konfigurasi vm azure mengizinkan akses ke port 8000
