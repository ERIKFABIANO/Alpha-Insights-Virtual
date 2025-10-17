export async function chat (prompt: string) {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            model:'gemma3:latest',
            prompt:prompt,
            stream: false
        })
    })
    if (!response.ok) {
    throw new Error(`Ошибка: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
}

