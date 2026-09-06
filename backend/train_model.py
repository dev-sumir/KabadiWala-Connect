import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models

def train():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Training on device: {device}")

    data_dir = 'KabadiWala Model'
    
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Full dataset
    full_dataset = datasets.ImageFolder(data_dir, transform=train_transforms)
    class_names = full_dataset.classes
    print(f"Detected {len(class_names)} classes: {class_names}")

    # Split dataset
    total_len = len(full_dataset)
    train_len = int(0.85 * total_len)
    val_len = total_len - train_len
    train_set, val_set = random_split(full_dataset, [train_len, val_len], generator=torch.Generator().manual_seed(42))

    train_loader = DataLoader(train_set, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_set, batch_size=16, shuffle=False, num_workers=0)

    # Load MobileNetV3-Small
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    
    # Freeze feature extractor initially for stability
    for param in model.features.parameters():
        param.requires_grad = False
    
    # Replace final classification head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, len(class_names))
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=0.002, weight_decay=1e-4)

    print("\n--- Phase 1: Train classification head (6 epochs) ---")
    for epoch in range(1, 7):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_acc = (correct / total) * 100
        print(f"Epoch {epoch}/6 - Head Loss: {running_loss/total:.4f}, Train Acc: {epoch_acc:.2f}%")

    print("\n--- Phase 2: Fine-tune entire network (6 epochs) ---")
    for param in model.parameters():
        param.requires_grad = True
        
    fine_optimizer = torch.optim.AdamW(model.parameters(), lr=0.0003, weight_decay=1e-4)

    for epoch in range(1, 7):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            fine_optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            fine_optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_acc = (correct / total) * 100
        print(f"Fine-tune Epoch {epoch}/6 - Loss: {running_loss/total:.4f}, Train Acc: {epoch_acc:.2f}%")

    # Evaluate on Validation set
    model.eval()
    val_correct = 0
    val_total = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            val_correct += torch.sum(preds == labels.data).item()
            val_total += labels.size(0)

    val_acc = (val_correct / val_total) * 100
    print(f"\nFinal Validation Accuracy: {val_acc:.2f}% ({val_correct}/{val_total})")

    # Save model weights and class index mapping
    save_path = 'waste_classifier.pth'
    torch.save(model.state_dict(), save_path)
    print(f"Saved model to {save_path}")

    mapping_path = 'class_mapping.json'
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(class_names, f, ensure_ascii=False, indent=2)
    print(f"Saved class mapping to {mapping_path}")

if __name__ == '__main__':
    train()
