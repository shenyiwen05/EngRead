import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReaderLayout } from './ReaderLayout'
import { mockArticle } from '../../mock/mockArticle'

describe('ReaderLayout', () => {
  it('starts in a reading-first state without translations or explanation details', () => {
    render(<ReaderLayout article={mockArticle} selection={null} onSelect={vi.fn()} />)

    expect(screen.queryByText(mockArticle.paragraphs[0].sentences[0].translation)).not.toBeInTheDocument()
    expect(screen.queryByText('开始承压、面临压力')).not.toBeInTheDocument()
    expect(screen.getByText('点击文章中的词组、单词或长句，这里会显示解释。')).toBeInTheDocument()
  })

  it('uses quiet support columns and a prose-first reading canvas', () => {
    render(<ReaderLayout article={mockArticle} selection={null} onSelect={vi.fn()} />)

    expect(screen.getByTestId('reader-layout')).toHaveClass(
      'lg:grid-cols-[96px_minmax(0,760px)_360px]',
    )
    expect(screen.getByTestId('paragraph-nav')).toHaveClass('lg:sticky')
    expect(screen.getByTestId('reading-canvas')).toHaveClass('reader-canvas')
    expect(screen.getByTestId('reading-canvas')).not.toHaveClass('shadow-sm')
    expect(screen.getByTestId('explanation-rail')).toHaveClass('reader-support-panel')
  })
})
